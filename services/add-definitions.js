/* global module */
'use strict'

const Dictionary = require('../lib/dictionary')
const async = require('async')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
const bodyParserMW = require('../lib/middlewares/incomming/body-parser.middleware')
const responseMW = require('../lib/middlewares/outgoing/response.middleware')
const warmupMW = require('../lib/middlewares/incomming/warmup.middleware')
const loggerMW = require('../lib/middlewares/incomming/logger.middleware')
const xrayMW = require('../lib/middlewares/incomming/xray.middleware')

const handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    async.waterfall([
      async () => {
        return Dictionary.init()
      },
      async () => {
        return new Promise((resolve, reject) => {
          Dictionary.putDefinitions(event.body.definitions, async (err, data) => {
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
