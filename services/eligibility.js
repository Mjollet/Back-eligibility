'use strict'

const async = require('async')
const schemaValidateMW = require('../lib/middlewares/incomming/schema-validator.middleware')
const Evaluator = require('../lib/evaluator')
const withMiddlewares = require('sams-js-submodules').samsLambdaMiddlewareOrch
const bodyParserMW = require('../lib/middlewares/incomming/body-parser.middleware')
const responseMW = require('../lib/middlewares/outgoing/response.middleware')
const warmupMW = require('../lib/middlewares/incomming/warmup.middleware')
const loggerMW = require('../lib/middlewares/incomming/logger.middleware')
const xrayMW = require('../lib/middlewares/incomming/xray.middleware')

const handler = async (event, context) => {
  const type = event.pathParameters.type || undefined
  const level = event.pathParameters.level || undefined
  const body = event.body

  if (!type || !level) {
    let err = new Error('Bad Request: missing type and/or level param(s) in the path')
    err.statusCode = 404
    throw err
  }

  var subjects = []
  if (level === 'AssessProducts' && body.hasOwnProperty('products') && Array.isArray(body.products)) {
    subjects = body.products
  } else if (level === 'AssessOffers' && body.hasOwnProperty('offers') && Array.isArray(body.offers)) {
    subjects = body.offers
  } else {
    let err = new Error('Bad Request')
    err.statusCode = 404
    throw err
  }
  // prepare evaluation engine
  await Evaluator.init()
  var result = []
  return new Promise((resolve, reject) => {
    async.eachSeries(subjects, (s, callback) => {
      Evaluator.assessSubject(s, type, body, (err, subResult) => {
        if (err) {
          return callback(err)
        }
        result.push(subResult)
        return callback()
      })
    }, async (err) => {
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
    schemaValidateMW.validateGenericEligibilitySchema
  ],
  handler,
  [
    responseMW.send
  ]
)
