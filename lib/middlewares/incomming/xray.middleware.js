'use-strict'

// const xray = require('aws-xray-sdk')
// const aws = require('aws-sdk')

/**
 * Setups samsLoggerJs utility by calling .prepare method. Logs info about incoming event and context.
 * @param {*} event Lambda http event
 * @param {*} context Lambda context
 * @param {*} next next middleware
 */
const XrayWare = async (event, context, next) => {
  // xray.captureAWS(aws)
  return next(event, context)
}

module.exports = XrayWare
