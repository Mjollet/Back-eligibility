'use-strict'

const log = require('sams-js-submodules').samsLoggerJs

/**
 * Setups samsLoggerJs utility by calling .prepare method. Logs info about incoming event and context.
 * @param {*} event Lambda http event
 * @param {*} context Lambda context
 * @param {*} next next middleware
 */
const LoggerWare = async (event, context, next) => {
  log.prepare(event, context)
  log.info('Incoming event', {
    event: event,
    context: context
  })
  return next(event, context)
}

module.exports = LoggerWare
