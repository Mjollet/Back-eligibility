'use-strict'

const AWS = require('aws-sdk')
const async = require('async')
const log = require('sams-js-submodules').samsLoggerJs
const SchemaValidator = new (require('sams-js-submodules').SamsSchemaValidator)()
const Cache = require('./cache')

/**
 * Module implements a handler to work with dictionary
 */
const Dictionary = {
  tableName: process.env.DICTIONARY_TABLE_NAME,
  dbClient: null,
  initialized: false,
  validatorOpts: null,

  /**
   * Initializes SamsSchemaValidator, Cache module and DynamoDB service object (async)
   */
  init: async () => {
    if (Dictionary.initialized) {
      log.info('Dictionary:init Already intialized. Skipping')
      return
    }
    AWS.config.update({
      region: process.env.AWS_DYNAMODB_REGION,
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT
    })
    await Dictionary.initSchemaValidator()
    Cache.init()
    Dictionary.dbClient = new AWS.DynamoDB.DocumentClient()
    Dictionary.initialized = true
  },

  initSchemaValidator: async () => {
    if (Dictionary.validatorOpts) {
      log.info('Dictionary:initSchemaValidator Already intialized. Skipping')
      return
    }
    Dictionary.validatorOpts = {
      local: false,
      s3: {
        region: process.env.REGION,
        bucket: process.env.S3_ELIGIBILITY_SCHEMA_BUCKET_NAME
      }
    }
    if (process.env.STAGE === 'localhost') {
      Dictionary.validatorOpts.s3.endpoint = process.env.S3_ENDPOINT
      Dictionary.validatorOpts.s3.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_KEY_ID
      }
    }
    await SchemaValidator.init(Dictionary.validatorOpts)
  },

  /**
   * Resets Dictionary initialization and depending modules: Cache
   */
  reset: () => {
    Dictionary.initialized = false
    Cache.reset()
  },

  /**
   * Adds a defnition in the dictionary
   * @param {object} definition item to put into dictionary
   * @param {function} callback
   */
  putDefinition: (definition, callback) => {
    if (!Dictionary.isDefinition(definition)) {
      var err = new Error('Invalid definition')
      err.statusCode = 400
      return callback(err)
    }
    var params = {
      TableName: Dictionary.tableName,
      Item: definition
    }
    log.info('DynamoDB:dictionary:putDefinition', {
      params
    })
    Dictionary.dbClient.put(params, callback)
  },

  /**
   * Removes definition by label and category
   * @param {string} label definition's label
   * @param {string} category definition's category (eligibility type, e.g. commercial)
   * @param {fuction} callback
   */
  deleteDefinition: (label, category, callback) => {
    var err
    if (!label) {
      err = new Error('Bad request')
      err.statusCode = 400
      return callback(err)
    }
    if (!category) {
      err = new Error('Bad request')
      err.statusCode = 400
      return callback(err)
    }
    var params = {
      TableName: Dictionary.tableName,
      Key: {
        label: label,
        category: category
      }
    }
    log.info('DynamoDB:dictionary:deleteDefinition', {
      params
    })
    Dictionary.dbClient.delete(params, callback)
  },

  /**
  * Inserts a list of definitions into the collection using DynamoDB batch write operation.
  * Definitions are being writen in bunches of 25 items with retry of unprocessed items.
  * @param {Definition[]} definitions list of definitions
  * @param {function} callback
  */
  putDefinitions: (definitions, callback) => {
    var err
    if (!Array.isArray(definitions)) {
      err = new Error('definitions must be an array')
      err.statusCode = 400
      return callback(err)
    }
    var queue = []
    var count = 0
    var params = {
      RequestItems: {}
    }
    params.RequestItems[Dictionary.tableName] = []

    for (var i = 0, len = definitions.length; i < len; i++) {
      if (!Dictionary.isDefinition(definitions[i])) {
        err = new Error('Invalid definition at index ' + i)
        err.statusCode = 400
        return callback(err)
      }
      if (count === 25) {
        queue.push(params)
        params = {
          RequestItems: {}
        }
        params.RequestItems[Dictionary.tableName] = []
        count = 0
      }
      params.RequestItems[Dictionary.tableName].push({
        PutRequest: {
          Item: definitions[i]
        }
      })
      count++
    }
    if (params.RequestItems[Dictionary.tableName].length) {
      queue.push(params)
      params = null
    }
    log.info('DynamoDB:dictionary:putDefinitions (batchWrite)', {
      params,
      queue
    })
    async.map(queue, function (p, callback) {
      return Dictionary.dbClient.batchWrite(p, Dictionary.doBatchWriteItem(callback))
    }, callback)
  },

  /**
  * @private
  * @description Helper function to handle unprocessed .writeBatch items
  * @param {function} callback
  * @returns reqursive function which can be passed to .batchWrite (DynamoDB) as a callback
  */
  doBatchWriteItem: (callback) => {
    const doBatchWIBis = (err, data) => {
      if (err) {
        return callback(err) // an error occurred
      } else {
        if ('UnprocessedItems' in data && Dictionary.tableName in data.UnprocessedItems) {
          // More data. Call again with the unprocessed items.
          var params = {
            RequestItems: data.UnprocessedItems
          }
          // Calling BatchWriteItem again to retry Unprocessed items
          Dictionary.dbClient.batchWrite(params, doBatchWIBis)
        } else {
          // BatchWriteItem processed all items in the batch
          callback(null, data)
        }
      }
    }
    return doBatchWIBis
  },

  /**
  * Fetches single definition matching the label and category. Uses cached result if possible
  * @param {string} label definition's label
  * @param {string} category definition's category (eligibility type, e.g. commercial)
  * @param {function} callback
  */
  getDefinition: (label, category, callback) => {
    var params = {
      TableName: Dictionary.tableName,
      Key: {
        label: label,
        category: category
      }
    }
    // check the cache for label definition
    let cachedDef = Cache.getItem('definitions', category + label)
    if (cachedDef) {
      log.debug('Using cached label\'s definition', {
        label: label,
        cachedDef
      })
      return callback(null, cachedDef)
    }
    log.info('DynamoDB:dictionary:getDefinition', {
      params
    })
    Dictionary.dbClient.get(params, function (err, def) {
      if (err) {
        return callback(err)
      }
      if (!def.Item) {
        log.warn('DynamoDB:dictionary:notFound', {
          label
        })
        return callback(null, def.Item)
      }
      try {
        log.debug('Caching label\'s definition', {
          label: label,
          definition: def.Item
        })
        Cache.setItem('definitions', category + label, def.Item)
      } catch (err) {
        log.error('Error while caching label\'s definition', {
          err,
          category,
          label: label,
          definition: def.Item
        })
        return callback(err)
      }
      return callback(null, def.Item)
    })
  },

  /**
   * Fetches definition from database and returns it's symbol
   * @param {string} label definition's label
   * @param {string} category definition's category (eligibility type, e.g. commercial)
   * @param {function} callback
   */
  getSymbol: (label, category, callback) => {
    Dictionary.getDefinition(label, category, function (err, def) {
      if (err) {
        return callback(err)
      }
      if (!def) {
        return callback(new Error('Label not found : ' + label))
      }
      return callback(null, def.symbol)
    })
  },

  /**
   * Fetches definition from database and returns it's type
   * @param {string} label definition's label
   * @param {string} category definition's category (eligibility type, e.g. commercial)
   * @param {function} callback
   */
  getType: (label, category, callback) => {
    Dictionary.getDefinition(label, category, function (err, def) {
      if (err) {
        return callback(err)
      }
      if (!def) {
        return callback(new Error('Label not found : ' + label))
      }
      return callback(null, def.type)
    })
  },

  /**
  * Scans DynamoDB for all definitions matching the category
  * @param {string} category definition's category (eligibility type, e.g. commercial)
  * @param {function} callback
  */
  getAllByCategory: (category, callback) => {
    var params = {
      TableName: Dictionary.tableName,
      FilterExpression: '#t = :givenCategory',
      ExpressionAttributeNames: {
        '#t': 'category'
      },
      ExpressionAttributeValues: {
        ':givenCategory': category
      },
      Limit: 15
    }
    log.info('DynamoDB:dictionary:getAllByCategory', {
      params
    })
    Dictionary.dbClient.scan(params, Dictionary.doScan(params, callback))
  },

  /**
  * Scans definitions collection and returns all definitions to the callback
  * @param {function} callback
  */
  getAll: (callback) => {
    var params = {
      TableName: Dictionary.tableName,
      Limit: 15
    }
    log.info('DynamoDB:dictionary:getAll', {
      params
    })
    Dictionary.dbClient.scan(params, Dictionary.doScan(params, callback))
  },

  /**
  * @private
  * @description Helper function to handle unprocessed scan items
  * @param {object} params
  * @param {function} callback
  * @returns reqursive function which can be passed to .scan function (DynamoDB) as a callback
  */
  doScan: (params, callback) => {
    var definitions = []
    const doScanBis = (err, data) => {
      if (err) {
        return callback(err) // an error occurred
      } else {
        for (var i = 0, len = data.Items.length; i < len; i++) {
          definitions.push(data.Items[i])
        }
        // More data.  Keep calling scan.
        if ('LastEvaluatedKey' in data) {
          //  Calling Scan again for another page of results
          params.ExclusiveStartKey = data.LastEvaluatedKey
          log.info('DynamoDB:dictionary:doScan', {
            params
          })
          Dictionary.dbClient.scan(params, doScanBis)
        } else {
          // Finished the scan
          return callback(null, definitions)
        }
      }
    }
    return doScanBis
  },

  /**
   * Determines if object matches definition schema
   * @param {object} object
   */
  isDefinition: (object) => {
    let isValid = SchemaValidator.validateSync('dictionary.schema.json#/definitions/entry', object)
    if (!isValid) {
      log.error('Schema validation error', {
        entity: object,
        schemaName: 'dictionary.schema.json#/definitions/entry'
      })
    }
    return isValid
  }
}

module.exports = {
  init: Dictionary.init,
  putDefinition: Dictionary.putDefinition,
  putDefinitions: Dictionary.putDefinitions,
  getDefinition: Dictionary.getDefinition,
  getSymbol: Dictionary.getSymbol,
  getType: Dictionary.getType,
  getAllByCategory: Dictionary.getAllByCategory,
  getAll: Dictionary.getAll,
  deleteDefinition: Dictionary.deleteDefinition,
  isDefinition: Dictionary.isDefinition,
  reset: Dictionary.reset
}
