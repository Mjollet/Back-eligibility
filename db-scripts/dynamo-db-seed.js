'ues strict'

const AWS = require('aws-sdk')

const AWSaccessKeyId = 'localhost-key'
const AWSsecretAccessKey = 'localhost-secret'
const AWSregion = 'localhost'

AWS.config.update({
  accessKeyId: AWSaccessKeyId,
  secretAccessKey: AWSsecretAccessKey,
  region: AWSregion
})

const dynamodb = new AWS.DynamoDB({ endpoint: new AWS.Endpoint('http://localhost:8000') })

// other script params
const RECREATE = true
const tableSchemas = require('./config').schemas
const dictionarySeed = require('./seeds/dictionary-seed')
const rulesSeed = require('./seeds/rules-seed')

async function init () {
  if (RECREATE) {
    try {
      await dropAllTables(tableSchemas)
      await createAllTables(tableSchemas)
      await putData(dynamodb)
    } catch (err) {
      throw new Error(err)
    }
  } else {
    // keep the tables, alter only the data inside
    try {
      await createAllTables(tableSchemas)
      await putData(dynamodb)
    } catch (err) {
      throw new Error(err)
    }
  }
}

async function createAllTables (tableConfigs) {
  console.log('Creating tables:')
  return new Promise((resolve, reject) => {
    let createPromises = tableConfigs.map(params => {
      return new Promise((resolve, reject) => {
        dynamodb.createTable(params, function (err, data) {
          if (err) reject(err)
          else {
            console.log(` + ${data.TableDescription.TableName}`)
            resolve(data)
          }
        })
      })
    })
    Promise.all(createPromises).then(results => {
      resolve(results)
    })
      .catch(err => {
        reject(err)
      })
  })
}

async function dropAllTables (tableConfigs) {
  let _tableConfigs = tableConfigs.map(config => {
    return { 'TableName': config.TableName }
  })
  console.log('Dropping tables:')
  return new Promise((resolve, reject) => {
    let createPromises = _tableConfigs.map(params => {
      return new Promise((resolve, reject) => {
        dynamodb.deleteTable(params, function (err, data) {
          if (err) {
            if (err.code === 'ResourceNotFoundException') {
              console.log('Skipping non-existing table:', params.TableName)
              resolve()
            } else {
              reject(err)
            }
          } else {
            console.log(` - ${data.TableDescription.TableName}`)
            resolve(data)
          }
        })
      })
    })
    Promise.all(createPromises).then(results => {
      resolve(results)
    })
      .catch(err => {
        reject(err)
      })
  })
}

function putData (db) {
  console.log('Putting data..')
  Promise.all([
    dictionarySeed(db),
    rulesSeed(db)
  ])
}

try {
  init().then(result => {
    console.log('Done!')
  })
} catch (err) {
  console.log(err)
}
