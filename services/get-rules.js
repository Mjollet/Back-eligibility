/* global module */
'use strict'

const Rules = require('../lib/rules')
const async = require('async')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
const responseMW = require('../lib/middlewares/outgoing/response.middleware')
const warmupMW = require('../lib/middlewares/incomming/warmup.middleware')
const loggerMW = require('../lib/middlewares/incomming/logger.middleware')
const xrayMW = require('../lib/middlewares/incomming/xray.middleware')

const handler = async (event, context) => {
  const type = event.pathParameters.type || undefined
  if (!type) {
    let err = new Error('Bad Request')
    err.statusCode = 400
    throw err
  }
  return new Promise((resolve, reject) => {
    async.waterfall([
      async () => {
        return Rules.init()
      },
      async () => {
        return new Promise((resolve, reject) => {
          Rules.getRulesByType(type, async (err, rulesSet) => {
            if (err) {
              return reject(err)
            }
            return resolve({
              rules: rulesSet
            })
          })
        })
      }], async (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve(result)
    })
  })
}

module.exports.handler = withMiddlewares(
  [
    xrayMW,
    warmupMW,
    loggerMW,
    responseMW.init
  ],
  handler,
  [
    responseMW.send
  ]
)
