'use-strict'

const log = require('sams-js-submodules').samsLoggerJs

/**
 * Parses http body of incoming event. Assumes that body is JSON, otherwise throws an Error
 * @param {*} event Lambda http event
 * @param {*} context Lambda context
 * @param {*} next next middleware
 * @throws {Error} JSON parsing error
 */
const bodyParserWare = async (event, context, next) => {
  if (!event.body) {
    let err = new Error('Bad Request')
    log.error('Event body does not exist', {
      err: err,
      event: event
    })
    err.statusCode = 400
    throw err
  }
  // parse incoming json body
  try {
    event.body = JSON.parse(event.body)
  } catch (err) {
    log.error('Event body parsing error', {
      err: err,
      body: event.body
    })
    throw err
  }
  return next(event, context)
}

module.exports = bodyParserWare
