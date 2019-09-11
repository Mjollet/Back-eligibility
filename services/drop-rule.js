/* global module */
'use strict'

const Rules = require('../lib/rules')
const async = require('async')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
const bodyParserMW = require('../lib/middlewares/incomming/body-parser.middleware')
const responseMW = require('../lib/middlewares/outgoing/response.middleware')
const warmupMW = require('../lib/middlewares/incomming/warmup.middleware')
const loggerMW = require('../lib/middlewares/incomming/logger.middleware')
const xrayMW = require('../lib/middlewares/incomming/xray.middleware')

const handler = async (event, context) => {
  const body = event.body
  const type = event.pathParameters.type || undefined
  if (!type) {
    let err = new Error('Bad Request')
    err.statusCode = 400
    throw err
  }
  if (!body.hasOwnProperty('ruleTag') || !body.ruleTag) {
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
          Rules.deleteRule(body.ruleTag, type, async (err, data) => {
            if (err) {
              return reject(err)
            }
            return resolve({
              message: 'success'
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
    responseMW.init,
    bodyParserMW
  ],
  handler,
  [
    responseMW.send
  ]
)
