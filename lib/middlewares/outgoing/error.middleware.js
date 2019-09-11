'use-strict'

const log = require('sams-js-submodules').samsLoggerJs

/**
 * General error handler
 * @param {*} event Lambda http event
 * @param {*} context Lambda context
 * @param {*} next next middleware
 */
const ErrorWare = async (err, context, next) => {
  log.error('General error', {err})
  // any error transformation should be done here
  return next(err, context)
}

module.exports = ErrorWare
