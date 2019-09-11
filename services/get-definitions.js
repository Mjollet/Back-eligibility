/* global module */
'use strict'

const Dictionary = require('../lib/dictionary')
const async = require('async')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
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
          Dictionary.getAll(async (err, data) => {
            if (err) {
              return reject(err)
            }
            return resolve(data)
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
