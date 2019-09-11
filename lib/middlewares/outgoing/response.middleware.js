'use-strict'

const response = require('../../response')

/**
 * Response Middleware implements methods for sending response
 */
const responseWare = {
  /**
   * Initializes response module
   * @param {*} event Lambda http event
   * @param {*} context Lambda context
   * @param {*} next next middleware
   */
  init: async (event, context, next) => {
    response.init(event)
    return next(event, context)
  },

  /**
   * Sends response with result as response body
   * @param {Object} result response body
   * @param {*} context Lambda context
   * @param {*} next next middleware
   */
  send: async (result, context, next) => {
    if (result instanceof Error) {
      result = response.error(result)
    } else {
      result = await response.prepare({
        body: result
      })
    }
    return next(result, context)
  }
}

module.exports = responseWare
