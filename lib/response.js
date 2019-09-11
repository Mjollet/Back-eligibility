'use strict'

const log = require('sams-js-submodules').samsLoggerJs
const convert = require('xml-js')
const zlib = require('zlib')

const Response = {
  activateZlib: false,

  init: (event) => {
    let acceptEncoding = event.headers['accept-encoding'] || event.headers['Accept-Encoding'] || ''
    Response.activateZlib = acceptEncoding.includes('gzip')
  },

  getTemplate: (contentType = 'application/json') => {
    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: {},
      headers: {
        'Content-Type': `${contentType}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }
    }
  },

  error: (err, contentType = 'application/json') => {
    const res = Response.getTemplate(contentType)
    res.statusCode = err.statusCode || 500
    const errorBody = {
      message: err.message,
      details: err.details,
      code: err.code
    }

    Response.prepareBody(res, errorBody)

    log.error('Error response', {
      response: res
    })
    return res
  },

  gzip: async (res) => {
    const bufferObject = Buffer.from(res.body)
    return new Promise((resolve, reject) => {
      zlib.gzip(bufferObject, (error, zipedBody) => {
        if (error) {
          log.error('Error while running zlib', error)
          return reject(error)
        }
        res.body = zipedBody.toString('base64')
        res.headers['Content-Encoding'] = 'gzip'
        res.isBase64Encoded = true
        resolve(res)
      })
    })
  },

  prepare: async (opts) => {
    if (!opts) {
      return Response.getTemplate()
    }

    const res = Response.getTemplate(opts && opts.headers && opts.headers['Content-Type'] ? opts.headers['Content-Type'] : undefined)

    Response.prepareBody(res, opts.body)

    res.statusCode = opts.statusCode || 200
    res.headers = opts.headers || res.headers

    if (Response.activateZlib) {
      try {
        await Response.gzip(res)
      } catch (e) {
        log.error('Error while trying to gzip response', e)
      }
    }

    log.info('Success response', {
      response: res
    })

    return res
  },

  prepareBody: (res, body) => {
    switch (true) {
      case Response.isXMLHeader(res):
        const xmlOptions = {
          compact: true
        }
        res.body = convert.json2xml(body, xmlOptions) || convert.json2xml({}, xmlOptions)
        break

      default:
        res.body = JSON.stringify(body, Response.replaceErrors) || JSON.stringify({})
    }
  },

  replaceErrors: (key, value) => {
    if (value instanceof Error) {
      var error = {}
      Object.getOwnPropertyNames(value).forEach(function (key) {
        if (key === 'message') {
          error[key] = value[key]
        }
      })
      return error
    }
    return value
  },

  isXMLHeader: (res) => {
    if (res.headers['Content-Type'] === 'application/xml' || res.headers['Content-Type'] === 'text/xml') {
      return true
    }
    return false
  }
}

module.exports = Response
