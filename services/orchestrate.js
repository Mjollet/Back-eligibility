/* global module */
'use strict'

const async = require('async')
const schemaValidateMW = require('../lib/middlewares/incomming/schema-validator.middleware')
const orchestrator = require('../lib/orchestrator')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
const bodyParserMW = require('../lib/middlewares/incomming/body-parser.middleware')
const responseMW = require('../lib/middlewares/outgoing/response.middleware')
const warmupMW = require('../lib/middlewares/incomming/warmup.middleware')
const loggerMW = require('../lib/middlewares/incomming/logger.middleware')
const xrayMW = require('../lib/middlewares/incomming/xray.middleware')

const handler = (event, context, callback) => {
  const workflow = event.pathParameters.workflow || undefined
  const level = event.pathParameters.level || undefined
  const body = event.body
  return new Promise((resolve, reject) => {
    async.waterfall([
      async () => {
        await orchestrator.init()
      },
      (val, callback) => {
        switch (workflow) {
          case 'global':
            orchestrator.runGlobalEligibility(body, level, callback)
            break
          case 'technical':
            orchestrator.runTechEligibility(body, level, callback, true)
            break
          case 'commercial':
            orchestrator.runCommEligibility(body, level, callback, true)
            break
          default:
            let err = new Error('Workflow not found')
            err.statusCode = 404
            return callback(err)
        }
      }
    ], (err, result) => {
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
    bodyParserMW,
    schemaValidateMW.init,
    schemaValidateMW.validateGlobalEligibilitySchema
  ],
  handler,
  [
    responseMW.send
  ]
)
