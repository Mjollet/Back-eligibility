'use strict'

const async = require('async')
const schemaValidateMW = require('../lib/middlewares/incomming/schema-validator.middleware')
const MUSE = require('../lib/muse')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
const bodyParserMW = require('../lib/middlewares/incomming/body-parser.middleware')
const responseMW = require('../lib/middlewares/outgoing/response.middleware')
const warmupMW = require('../lib/middlewares/incomming/warmup.middleware')
const loggerMW = require('../lib/middlewares/incomming/logger.middleware')

const handler = async (event, context) => {
  const body = event.body
  return new Promise((resolve, reject) => {
    async.waterfall([
      async () => {
        await MUSE.init()
      },
      async () => {
        return MUSE.assessFunctionalities(body)
      }
    ], async (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve(result.body)
    })
  })
}

module.exports.handler = withMiddlewares(
  [
    warmupMW,
    loggerMW,
    responseMW.init,
    bodyParserMW,
    schemaValidateMW.init,
    schemaValidateMW.validateGlobOrGenEligibilitySchema
  ],
  handler,
  [
    responseMW.send
  ]
)
