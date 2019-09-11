'use-strict'

const log = require('sams-js-submodules').samsLoggerJs

/**
 * Checks if event source is from serverless warmup plugin and returns 'Lambda is warm!' result immediately
 * @param {*} event Lambda http event
 * @param {*} context Lambda context
 * @param {*} next next middleware
 */
const WarmupWare = (event, context, next) => {
  if (event.source === 'serverless-plugin-warmup') {
    log.prepare('WarmUP - Lambda is warm!')
    return 'Lambda is warm!'
  }
  return next(event, context)
}

module.exports = WarmupWare
