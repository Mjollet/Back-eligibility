const AWS = require('aws-sdk')
const dictionaryDataItems = require('../data/dictionary-data.json')

module.exports = async (dynamodb) => {
  AWS.config.update({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  const docClient = new AWS.DynamoDB.DocumentClient()

  let params = {
    RequestItems: {
      'localhost-Dictionary': []
    },
    ReturnConsumedCapacity: 'TOTAL', // optional (NONE | TOTAL | INDEXES)
    ReturnItemCollectionMetrics: 'TOTAL' // optional (NONE | TOTAL | INDEXES)
  }

  dictionaryDataItems.forEach(item => {
    params.RequestItems['localhost-Dictionary'].push({
      PutRequest: {
        Item: item
      }
    })
  })

  // in case you use dynamodb client directly, you need to pass this kind of structure (not recommended approach)
  // let params = {
  //   TableName: 'localhost-Dictionary',
  //   Item: {
  //     category: {
  //       S: 'commercial'
  //     },
  //     label: {
  //       S: 'Communication Channel (Web, Mobile)'
  //     },
  //     symbol: {
  //       S: '$.context.channel'
  //     },
  //     type: {
  //       S: 'string'
  //     }
  //   },
  //   ReturnValues: 'ALL_OLD', // optional (NONE | ALL_OLD)
  //   ReturnConsumedCapacity: 'TOTAL', // optional (NONE | TOTAL | INDEXES)
  //   ReturnItemCollectionMetrics: 'SIZE' // optional (NONE | SIZE)
  // }

  console.log('  >> localhost-Dictionary')
  return new Promise((resolve, reject) => {
    docClient.batchWrite(params, function (err, data) {
      if (err) reject(err) // an error occurred
      else resolve(data) // successful response
    })
  })
}
