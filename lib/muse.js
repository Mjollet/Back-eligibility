'use strict'

const request = require('request')
const log = require('sams-js-submodules').samsLoggerJs
const SchemaValidator = new (require('sams-js-submodules').SamsSchemaValidator)()
const SecretsManager = require('./secrets-manager')

/**
 * Module implements a handler to assess technical eligibility by calling Muse third-party service
 * @prop {object} DEFAULT Default Muse Secrets
 * @prop {object} SECRETS MUSE Secrets
 */
const MuseHandler = {
  DEFAULT: {
    MUSE_URL: process.env.MUSE_URL,
    MUSE_CLIENT_ID: process.env.MUSE_CLIENT_ID
  },
  SECRETS: null,
  validatorOpts: null,

  /**
   * Initializes SamsSchemaValidator and loads Muse Secrets (async)
   */
  init: async () => {
    await MuseHandler.initSchemaValidator()
    await MuseHandler.loadSecrets()
  },

  initSchemaValidator: async () => {
    if (MuseHandler.validatorOpts) {
      log.info('MuseHandler:initSchemaValidator Already intialized. Skipping')
      return
    }
    MuseHandler.validatorOpts = {
      local: false,
      s3: {
        region: process.env.REGION,
        bucket: process.env.S3_ELIGIBILITY_SCHEMA_BUCKET_NAME
      }
    }
    if (process.env.STAGE === 'localhost') {
      MuseHandler.validatorOpts.s3.endpoint = process.env.S3_ENDPOINT
      MuseHandler.validatorOpts.s3.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_KEY_ID
      }
    }
    await SchemaValidator.init(MuseHandler.validatorOpts)
  },

  /**
   * Resets Muse secrets
   */
  reset: () => {
    MuseHandler.SECRETS = null
  },

  /**
   * Loads Muse Secrets (async)
   * @returns Muse Secrets
   */
  loadSecrets: async () => {
    if (MuseHandler.SECRETS) {
      log.info('MuseHandler:init Already intialized. Skipping')
      return MuseHandler.SECRETS
    }
    if (process.env.STAGE === 'localhost') {
      MuseHandler.SECRETS = MuseHandler.DEFAULT
      return MuseHandler.SECRETS
    } else {
      MuseHandler.SECRETS = await new Promise((resolve, reject) => {
        SecretsManager.getSecrets(process.env.AWS_MUSE_TAG, (err, secrets) => {
          if (err) {
            return reject(err)
          } else {
            MuseHandler.SECRETS = secrets
            return resolve(secrets)
          }
        })
      })
      return MuseHandler.SECRETS
    }
  },

  /**
   * Assesses the functionalities by calling Muse (async)
   * @param {object} context request body
   * @returns {object} response of Technical Eligibility from Muse
   */
  assessFunctionalities: async (context) => {
    let isValid = await SchemaValidator.validate('tech-eligibility.schema.json', context)
    if (!isValid) {
      log.error('Schema validation error', {
        body: context,
        schemaName: 'tech-eligibility.schema.json'
      })
      let err = new Error('Bad Request: vehicle is required')
      err.statusCode = 400
      throw err
    }
    try {
      let [museResp, museBody, serviceFeatures] = await MuseHandler.requestMuse(context)
      return MuseHandler.processMuseResp(context, museResp, museBody, serviceFeatures)
    } catch (err) {
      throw err
    }
  },

  /**
   * Sends request to Muse. (async)
   * @param {object} context request body
   * @returns {Promise} A Promise which results in [responseObject, responseBody, featureCodes]
   * @throws {Error} Bad Request
   */
  requestMuse: async (context) => {
    let params = MuseHandler.prepareMuseCall(context)
    const qs = Object.assign({
      client_id: MuseHandler.SECRETS.MUSE_CLIENT_ID
    }, params)

    let err
    let isValid = await SchemaValidator.validate('vin-with-service-features.schema.json', qs)
    if (!isValid) {
      log.error('Schema validation error', {
        entity: context,
        schemaName: 'vin-with-service-features.schema.json'
      })
      err = new Error('Bad Request')
      err.statusCode = 400
      throw err
    }

    let reqOpts = {
      url: MuseHandler.SECRETS.MUSE_URL,
      method: 'GET',
      qs: qs,
      useQuerystring: true,
      gzip: true
    }

    return new Promise((resolve, reject) => {
      log.info('Calling MUSE', reqOpts)
      request(reqOpts, (err, res, _resBody) => {
        if (err) {
          return reject(err)
        }
        log.info('Response from MUSE', {
          err: err,
          response: res,
          body: _resBody
        })
        let _body
        try {
          _body = JSON.parse(_resBody)
        } catch (err) {
          log.error('Could not parse Muse response body', {
            err,
            responseBody: _resBody
          })
          return resolve([res, null, reqOpts.qs.serviceFeatures])
        }
        return resolve([res, _body, reqOpts.qs.serviceFeatures])
      })
    })
  },
  /**
   * Parses Muse response and maps it with the initial sent values
   * @param {object} context request body
   * @param {object} museResp Muse response
   * @param {object} museBody Muse response body
   * @param {string[]} serviceFeatures list of service features
   * @returns {object} with *statusCode* and *body* properties
   * @throws {Error} Muse error
   */
  processMuseResp: (context, museResp, museBody, serviceFeatures) => {
    if (museResp.statusCode !== 200) {
      switch (museResp.statusCode) {
        case 404:
          {
            if (Array.isArray(serviceFeatures)) {
              museBody = serviceFeatures.map(item => {
                return {
                  code: item,
                  notFound: true
                }
              })
            } else {
              museBody = [{
                code: serviceFeatures,
                notFound: true
              }]
            }
            break
          }
        default:
          {
            let err = new Error('Generic Muse error')
            err.statusCode = museResp.statusCode
            if (Array.isArray(serviceFeatures)) {
              museBody = serviceFeatures.map(item => {
                return {
                  code: item,
                  error: err
                }
              })
            } else {
              museBody = [{
                code: serviceFeatures,
                error: err
              }]
            }
          }
      }
    } else if (!Array.isArray(museBody)) {
      let err = new Error('Invalid Muse response')
      err.statusCode = museResp.statusCode
      museBody = [{
        code: Array.isArray(serviceFeatures) ? serviceFeatures[0] : serviceFeatures,
        error: err
      }]
    }
    return {
      statusCode: 200,
      body: MuseHandler.formatMuseResp(context, museResp, museBody, serviceFeatures)
    }
  },

  /**
   * Formats the result from Muse call
   * @param {object} context request body
   * @param {object} museResp Muse reponse
   * @param {object} museBody Muse response body
   * @param {string[]} serviceFeatures list of service features
   * @returns {object} formated evaluation of Technical Eligibility
   */
  formatMuseResp: (context, museResp, museBody, serviceFeatures) => {
    // map input service features with MUSE output
    return serviceFeatures.map(sf => {
      let item = museBody.find(item => {
        return item.code === sf
      })
      if (item !== undefined && !item.notFound && !item.error) {
        // everything went well
        return {
          code: item.code,
          iseligible: item.eligible,
          description: [{
            rule: '__AssessMUSE',
            shortLabel: item.shortLabel,
            result: item.eligible,
            stack: [{
              condition: '__PSAFeatureCodeAssessment',
              result: item.eligible
            }]
          }]
        }
      } else if (item === undefined || item.notFound) {
        // servise feature was not found
        let error = new Error('Functionality not found')
        log.warn('Contains unsupported service features', {
          errorCode: 'NO_FS_FOUND',
          message: 'No service feature found',
          vin: context.vin,
          unsupportedServiceFeature: sf
        })
        return {
          code: sf,
          iseligible: false,
          description: [{
            rule: '__AssessMUSE',
            result: false,
            stack: [],
            error: error
          }]
        }
      } else if (item.error) {
        // generic error from Muse
        log.error('Muse response error', {
          errorCode: 'MUSE_ERROR',
          vin: context.vin,
          serviceFeature: item.code,
          responseBody: museBody,
          error: item.error
        })
        return {
          code: sf,
          iseligible: false,
          description: [{
            rule: '__AssessMUSE',
            result: false,
            stack: [],
            error: item.error
          }]
        }
      }
    })
  },

  /**
   * Extracts necessary parameters from context to call Muse service
   * @param {object} context request body
   * @returns {object} Muse payload
   * @throws {Error} Bad context
   */
  prepareMuseCall: (context) => {
    try {
      const payload = {
        'vin': context.vehicle.wmi + context.vehicle.vds + context.vehicle.vis,
        'serviceFeatures': (context.hasOwnProperty('functionality')) ? [context.functionality.PSAFeatureCode] : context.functionalities.map(item => item.PSAFeatureCode)
      }
      return payload
    } catch (err) {
      log.error('Couldn\'t prepare data for muse', {err, body: context})
      throw err
    }
  }
}

module.exports = {
  init: MuseHandler.init,
  assessFunctionalities: MuseHandler.assessFunctionalities,
  reset: MuseHandler.reset
}
