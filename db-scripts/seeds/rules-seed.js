const AWS = require('aws-sdk')
const async = require('async')
const dataItems = require('../data/rules-data.json')
const DB_NAME = 'localhost-Rules'

module.exports = async (dynamodb) => {
  AWS.config.update({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  const docClient = new AWS.DynamoDB.DocumentClient()
  const bundleSize = 25
  const doBatchWriteItem = (callback) => {
    const doBatchWIBis = (err, data) => {
      if (err) {
        return callback(err) // an error occurred
      } else {
        if ('UnprocessedItems' in data && DB_NAME in data.UnprocessedItems) {
          // More data. Call again with the unprocessed items.
          var params = {
            RequestItems: data.UnprocessedItems
          }
          console.log('DynamoDB:rules:doBatchWriteItem (retry unprocressed items)', {
            params
          })
          // Calling BatchWriteItem again to retry Unprocessed items
          docClient.batchWrite(params, doBatchWIBis, callback)
        } else {
          // BatchWriteItem processed all items in the batch
          callback()
        }
      }
    }
    return doBatchWIBis
  }

  let queue = []
  let params = {
    RequestItems: {
      'localhost-Rules': []
    },
    ReturnConsumedCapacity: 'TOTAL', // optional (NONE | TOTAL | INDEXES)
    ReturnItemCollectionMetrics: 'TOTAL' // optional (NONE | TOTAL | INDEXES)
  }

  dataItems.forEach((item, i) => {
    if (i > 0 && i % bundleSize === 0) {
      queue.push(params)
      // reset bundle
      params = {
        RequestItems: {}
      }
      params.RequestItems[DB_NAME] = []
    }
    params.RequestItems[DB_NAME].push({
      PutRequest: {
        Item: item
      }
    })
  })
  // add the last bundle to the queue
  queue.push(params)

  console.log(`  >> ${DB_NAME}`)
  return new Promise((resolve, reject) => {
    const callback = (err, data) => {
      if (err) {
        return reject(err)
      }
      return resolve(data)
    }
    async.each(queue, (params, callback) => {
      docClient.batchWrite(params, doBatchWriteItem(callback))
    }, callback)
  })
}
