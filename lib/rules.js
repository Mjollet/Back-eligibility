'use-strict'

const AWS = require('aws-sdk')
const async = require('async')
const log = require('sams-js-submodules').samsLoggerJs
const SchemaValidator = new (require('sams-js-submodules').SamsSchemaValidator)()
const Cache = require('./cache')

/**
 * Module implements a handler to work with rules
 */
const Rules = {
  tableName: process.env.RULES_TABLE_NAME,
  dbClient: null,
  initialized: false,
  validatorOpts: null,
  /**
   * Initializes SamsSchemaValidator, Cache modules and DynamoDB service object (async)
   */
  init: async () => {
    if (Rules.initialized) {
      log.info('Rules:init Already intialized. Skipping')
      return
    }
    AWS.config.update({
      region: process.env.AWS_DYNAMODB_REGION,
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT
    })
    await Rules.initSchemaValidator()
    Cache.init()
    Rules.dbClient = new AWS.DynamoDB.DocumentClient()
    Rules.initialized = true
  },

  initSchemaValidator: async () => {
    if (Rules.validatorOpts) {
      log.info('Rules:initSchemaValidator Already intialized. Skipping')
      return
    }
    Rules.validatorOpts = {
      local: false,
      s3: {
        region: process.env.REGION,
        bucket: process.env.S3_ELIGIBILITY_SCHEMA_BUCKET_NAME
      }
    }
    if (process.env.STAGE === 'localhost') {
      Rules.validatorOpts.s3.endpoint = process.env.S3_ENDPOINT
      Rules.validatorOpts.s3.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_KEY_ID
      }
    }
    await SchemaValidator.init(Rules.validatorOpts)
  },

  /**
   * Resets Rules module and it's dependencies: Cache
   */
  reset: () => {
    Rules.initialized = false
    Cache.reset()
  },

  /**
   * Assess if the given object is a rule
   * @param {*} object rule object
   * @returns {boolean}
   */
  isRule: (object) => {
    let isValid = SchemaValidator.validateSync('rule.schema.json#/definitions/rule', object)
    if (!isValid) {
      log.error('Schema validation error', {
        entity: object,
        schemaName: 'rule.schema.json#/definitions/rule'
      })
    }
    return isValid
  },

  /**
   * Adds a rule to the rules collection
   * @param {*} rule rule object
   * @param {string} type eligibility type
   * @param {function} callback
   */
  putRule: (rule, type, callback) => {
    if (!rule || !type || !Rules.isRule(rule) || rule.type !== type) {
      var err = new Error('Invalid Rule')
      err.statusCode = 400
      return callback(err)
    }
    var params = {
      TableName: Rules.tableName,
      Item: rule
    }
    log.info('DynamoDB:rules:putRule', {
      rule,
      type,
      params
    })
    Rules.dbClient.put(params, callback)
  },

  /**
   * Removes a rule from the rules collection
   * @param {string} ruleTag rule tag
   * @param {string} type eligibility type
   * @param {function} callback
   */
  deleteRule: (ruleTag, type, callback) => {
    var params = {
      TableName: Rules.tableName,
      Key: {
        ruleTag: ruleTag,
        type: type
      }
    }
    log.info('DynamoDB:rules:deleteRule', {
      ruleTag,
      type,
      params
    })
    Rules.dbClient.delete(params, callback)
  },

  /**
   * Adds a set of rules to the rules collection
   * @param {*[]} rules list of rules
   * @param {string} type eligibility type
   * @param {function} callback
   */
  putRules: (rules, type, callback) => {
    var r
    var queu = []
    var count = 0
    var params = {
      RequestItems: {}
    }
    params.RequestItems[Rules.tableName] = []

    for (var i = 0, len = rules.length; i < len; i++) {
      r = rules[i]
      if (!Rules.isRule(r) || r.type !== type) {
        var err = new Error('Invalid rule at index ' + i)
        err.statusCode = 400
        return callback(err)
      }
      if (count === 25) {
        queu.push(params)
        params = {
          RequestItems: {}
        }
        params.RequestItems[Rules.tableName] = []
        count = 0
      }
      params.RequestItems[Rules.tableName].push({
        PutRequest: {
          Item: r
        }
      })
      count++
    }
    if (params.RequestItems[Rules.tableName] && params.RequestItems[Rules.tableName].length > 0) {
      queu.push(params)
      params = {
        RequestItems: {}
      }
    }
    log.info('DynamoDB:rules:putRules (batchWrite)', {
      queue: queu
    })
    async.each(queu, (p, callback) => {
      Rules.dbClient.batchWrite(p, Rules.doBatchWriteItem(callback))
    }, callback)
  },

  /**
   * @private
   * @description Helper function to insert multiple items at a time and insures all the items are processed in the batch
   * @param {function} callback
   * @returns {function} reqursive function which result can be passes to .batchWrite (DynamoDB) as a callback
   */
  doBatchWriteItem: (callback) => {
    const doBatchWIBis = (err, data) => {
      if (err) {
        return callback(err) // an error occurred
      } else {
        if ('UnprocessedItems' in data && Rules.tableName in data.UnprocessedItems) {
          // More data. Call again with the unprocessed items.
          var params = {
            RequestItems: data.UnprocessedItems
          }
          log.info('DynamoDB:rules:doBatchWriteItem (retry unprocressed items)', {
            params
          })
          // Calling BatchWriteItem again to retry Unprocessed items
          Rules.dbClient.batchWrite(params, doBatchWIBis, callback)
        } else {
          // BatchWriteItem processed all items in the batch
          callback()
        }
      }
    }
    return doBatchWIBis
  },

  /**
   * Fetches the a sinle rule matching the ruleTag
   * @param {string} ruleTag rule tag
   * @param {string} type eligibility type
   * @param {function} callback
   */
  getRule: (ruleTag, type, callback) => {
    if (!ruleTag) {
      return callback(null, {
        description: 'No ruleTag defined',
        iseligible: true
      })
    }
    // check the cache
    let cachedRule = Cache.getItem('rules', type + ruleTag)
    if (cachedRule) {
      log.debug('Using cached rule', {
        cachedRule
      })
      return callback(null, cachedRule)
    }
    // if cached rule is not present, call dynamodb
    let params = {
      TableName: Rules.tableName,
      Key: {
        ruleTag: ruleTag,
        type: type
      }
    }
    log.info('DynamoDB:rules:getRule', {
      ruleTag,
      type
    })
    Rules.dbClient.get(params, (err, resData) => {
      if (err) {
        return callback(err)
      }
      let rule = resData.Item
      if (rule) {
        // put rule into the cache
        try {
          log.debug('Caching rule', {
            rule
          })
          Cache.setItem('rules', type + ruleTag, rule)
        } catch (err) {
          log.error('Error while caching the rule', {
            err,
            type,
            ruleTag
          })
          return callback(err)
        }
      } else {
        log.warn('DynamoDB:rules:notFound', {
          ruleTag
        })
      }
      return callback(null, rule)
    })
  },

  /**
   * Fetches all rules matching the specific type
   * @param {string} type eligibility type
   * @param {function} callback
   */
  getRulesByType: (type, callback) => {
    var params = {
      TableName: Rules.tableName,
      FilterExpression: '#t = :givenType',
      ExpressionAttributeNames: {
        '#t': 'type'
      },
      ExpressionAttributeValues: {
        ':givenType': type
      },
      Limit: 15
    }
    log.info('DynamoDB:rules:getRulesByType', {
      params
    })
    Rules.dbClient.scan(params, Rules.doScan(params, callback))
  },

  /**
   * Fetches all rules from rules collection
   * @param {function} callback
   */
  getAll: (callback) => {
    var params = {
      TableName: Rules.tableName,
      Limit: 15
    }
    log.info('DynamoDB:rules:getAll', {
      params
    })
    Rules.dbClient.scan(params, Rules.doScan(params, callback))
  },

  /**
   * Scans DynamoDB based on params
   * @param {*} params DynamoDB params
   * @param {function} callback when the scan is finished the callback is called with the final result
   * @returns {function} a recursive function that scans the database
   */
  doScan: (params, callback) => {
    var definitions = []
    const doScanBis = (err, data) => {
      if (err) {
        return callback(err) // an error occurred
      } else {
        // Print the results
        // console.log("Last scan processed " + data.ScannedCount + " items: ")
        for (var i = 0, len = data.Items.length; i < len; i++) {
          definitions.push(data.Items[i])
        }
        // console.log(" " + images.join(", "))

        // More data.  Keep calling scan.
        if ('LastEvaluatedKey' in data) {
          //  Calling Scan again for another page of results
          params.ExclusiveStartKey = data.LastEvaluatedKey
          log.info('DynamoDB:rules:doScan (scanning for another page of results)', {
            params
          })
          Rules.dbClient.scan(params, doScanBis)
        } else {
          // Finished the scan
          return callback(null, definitions)
        }
      }
    }
    return doScanBis
  }
}

module.exports = {
  init: Rules.init,
  isRule: Rules.isRule,
  putRule: Rules.putRule,
  deleteRule: Rules.deleteRule,
  putRules: Rules.putRules,
  getRule: Rules.getRule,
  getRulesByType: Rules.getRulesByType,
  getAll: Rules.getAll
}
