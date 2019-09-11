'use strict'

const async = require('async')
const log = require('sams-js-submodules').samsLoggerJs
const safeEval = require('notevil')
const tools = require('./tools')
const SecretsManager = require('./secrets-manager')
const Evaluator = require('./evaluator')
const Muse = require('./muse')

/**
 * Module implements a handler to run all types of eligibility flows
 * @prop {object} DEFAULT_EL_SECRET - default Eligibility Secrets used in localhost env derived from localhost environment variables
 * @prop {object} EL_SECRET - Eligibility Secrets derived from Secrets Manager
 */
const Orchestrator = {

  DEFAULT_EL_SECRET: {
    ELIGIBILITY_BASE_URL: process.env.ELIGIBILITY_BASE_URL
  },

  EL_SECRET: null,

  /**
   * Loads secrets and initializes Evaluator module (async)
   */
  init: async () => {
    await Orchestrator.loadSecrets()
    await Evaluator.init()
    await Muse.init()
  },

  /**
   * Reset Eligibility Secrets and module dependencies: Evaluator, Muse
   */
  reset: () => {
    Orchestrator.EL_SECRET = null
    Evaluator.reset()
    Muse.reset()
  },

  /**
   * Loads Eligibility Secrets from localhost environment or calls Secrets Manager (async)
   * @returns {object} Eligibility Secrets
   */
  loadSecrets: async () => {
    if (Orchestrator.EL_SECRET) {
      log.info('Orchestrator:init Already intialized. Skipping')
      return Orchestrator.EL_SECRET
    }
    if (process.env.STAGE === 'localhost') {
      Orchestrator.EL_SECRET = Orchestrator.DEFAULT_EL_SECRET
    } else {
      Orchestrator.EL_SECRET = await new Promise((resolve, reject) => {
        SecretsManager.getSecrets(process.env.AWS_ELIGIBILITY_TAG, (err, secrets) => {
          if (err) {
            return reject(err)
          } else {
            Orchestrator.EL_SECRET = secrets
            return resolve(secrets)
          }
        })
      })
    }
    log.debug('Eligibility Secrets', Orchestrator.EL_SECRET)
    return Orchestrator.EL_SECRET
  },

  /**
   * Runs technical and commercial eligibility in parallel
   * @param {object} context request body
   * @param {sting} level eligibility service level: AssessProducts, AssessBundles
   * @param {function} callback
   */
  runGlobalEligibility: (context, level, callback) => {
    var err
    switch (level) {
      case 'AssessFunctionalities':
        err = new Error('Bad Request - supports only commercial services or bunldes')
        err.statusCode = 400
        return callback(err)
      case 'AssessProducts':
        async.waterfall([
          (callback) => {
            async.parallel({
              techResults: (callback) => {
                Orchestrator.runTechEligibility(context, level, callback)
              },
              commResults: (callback) => {
                Orchestrator.runCommEligibility(context, level, callback)
              }
            }, callback)
          },
          (results, callback) => {
            Orchestrator.merge(context, level, results.commResults, results.techResults, callback)
          }
        ], callback)
        break
      case 'AssessBundles':
        async.waterfall([
          (callback) => {
            async.parallel({
              techResults: (callback) => {
                Orchestrator.runTechEligibility(context, level, callback)
              },
              commResults: (callback) => {
                Orchestrator.runCommEligibility(context, level, callback)
              }
            }, callback)
          },
          (results, callback) => {
            Orchestrator.merge(context, level, results.commResults, results.techResults, callback)
          }
        ], callback)
        break
      default:
        err = new Error('Invalid service level')
        return callback(err)
    }
  },

  /**
   * Runs technical eligibility
   * @param {object} context request body
   * @param {string} level eligibility service level: AssessFunctionalities, AssessProducts, AssessBundles
   * @param {function} callback
   * @param {boolean} toArray transform response into an array
   */
  runTechEligibility: (context, level, callback, toArray = false) => {
    var err, ids, functionalities, ctx
    switch (level) {
      case 'AssessMuse':
      // fallthrough
      case 'AssessFunctionalities':
        Orchestrator.assessTechEligibilities(context, callback, toArray)
        break
      case 'AssessProducts':
        if (!context.hasOwnProperty('products')) {
          err = new Error('No commercial services found !')
          err.statusCode = 400
          return callback(err)
        }
        ids = []
        functionalities = []
        context.products.forEach((pr) => {
          if (Array.isArray(pr.functionalities)) {
            pr.functionalities.forEach((sf) => {
              if (ids.indexOf(sf.PSAFeatureCode) === -1) {
                functionalities.push(sf)
                ids.push(sf.PSAFeatureCode)
              }
            })
          }
        })
        ctx = JSON.parse(JSON.stringify(context))
        delete ctx.products
        ctx.functionalities = functionalities
        Orchestrator.assessTechEligibilities(ctx, callback, toArray)
        break
      case 'AssessBundles':
        if (!context.hasOwnProperty('bundles')) {
          err = new Error('No bundles found !')
          err.statusCode = 400
          return callback(err)
        }
        ids = []
        functionalities = []
        context.bundles.forEach((b) => {
          if (Array.isArray(b.products)) {
            b.products.forEach((pr) => {
              if (Array.isArray(pr.functionalities)) {
                pr.functionalities.forEach((sf) => {
                  if (ids.indexOf(sf.PSAFeatureCode) === -1) {
                    functionalities.push(sf)
                    ids.push(sf.PSAFeatureCode)
                  }
                })
              }
            })
          }
        })
        ctx = JSON.parse(JSON.stringify(context))
        delete ctx.bundles
        ctx.functionalities = functionalities
        Orchestrator.assessTechEligibilities(ctx, callback)
        break
      default:
        err = new Error('Invalid service level')
        err.statusCode = 400
        return callback(err)
    }
  },

  /**
   * Runs commercial eligibility
   * @param {object} context request body
   * @param {string} level eligibility service level: AssessProducts, AssessBundles, AssessOffers
   * @param {function} callback
   * @param {boolean} toArray transforms response into an array
   */
  runCommEligibility: (context, level, callback, toArray = false) => {
    var err, ids, products, ctx
    switch (level) {
      case 'AssessFunctionalities':
        err = new Error('commercial services only support commercial services')
        err.statusCode = 400
        return callback(err)
      case 'AssessProducts':
        Orchestrator.assessCommEligibilities(context, callback, toArray)
        break
      case 'AssessBundles':
        if (!context.hasOwnProperty('bundles')) {
          err = new Error('No bundles found !')
          err.statusCode = 400
          return callback(err)
        }
        ids = []
        products = []
        context.bundles.forEach((b) => {
          if (Array.isArray(b.products)) {
            b.products.forEach((pr) => {
              if (ids.indexOf(pr.id) === -1) {
                ids.push(pr.id)
                products.push(pr)
              }
            })
          }
        })
        ctx = JSON.parse(JSON.stringify(context))
        delete ctx.bundles
        ctx.products = products
        Orchestrator.assessCommEligibilities(ctx, callback, toArray)
        break
      case 'AssessOffers':
        Orchestrator.assessOffersEligibilities(context, callback, toArray)
        break
      default:
        err = new Error('Invalid service level')
        err.statusCode = 400
        return callback(err)
    }
  },

  /**
   * Helper function to handle technical eligibility request by calling Muse service
   * @param {object} context request body with *functionalities* property
   * @param {function} callback
   * @param {boolean} toArray transforms response into an array
   */
  assessTechEligibilities: (context, callback, toArray = false) => {
    var err
    if (!context.hasOwnProperty('functionalities')) {
      err = new Error('Technical eligibility only supports functionalities')
      err.statusCode = 400
      return callback(err)
    }
    if (!Orchestrator.EL_SECRET) {
      err = new Error('Secret not initialized.')
      return callback(err)
    }
    async.waterfall([
      async () => {
        await Muse.init()
      },
      async () => {
        return Muse.assessFunctionalities(context)
      }
    ], async (err, res) => {
      if (err) {
        return callback(err)
      }
      let results = res.body
      if (!Array.isArray(results)) {
        try {
          results = toArray ? tools.objectToArray(results) : results
        } catch (err) {
          callback(err)
        }
      }
      return callback(null, results)
    })
  },

  /**
   * Helper function to handle commercial eligibility request
   * @param {object} context request body with *products* property
   * @param {function} callback
   * @param {boolean} toArray transforms response into an array
   */
  assessCommEligibilities: (context, callback, toArray = false) => {
    var err
    if (!context.hasOwnProperty('products')) {
      err = new Error('Commercial eligibility only supports commercial services')
      err.statusCode = 400
      return callback(err)
    }

    if (!Orchestrator.EL_SECRET) {
      err = new Error('Secret not initialized.')
      return callback(err)
    }
    let results = []
    async.each(context.products, (s, callback) => {
      Evaluator.assessSubject(s, 'commercial', context, (err, subResult) => {
        if (err) {
          return callback(err)
        }
        results.push(subResult)
        return callback()
      })
    }, async (err) => {
      if (err) {
        return callback(err)
      }
      return callback(null, results)
    })
  },

  /**
   * Helper function to handle commercial eligibility for offers
   * @param {object} context request body with *offers* property
   * @param {function} callback
   * @param {boolean} toArray transforms response into an array
   */
  assessOffersEligibilities: (context, callback, toArray = false) => {
    var err
    if (!context.hasOwnProperty('offers')) {
      err = new Error('Missing offers property')
      err.statusCode = 400
      return callback(err)
    }
    if (!Orchestrator.EL_SECRET) {
      err = new Error('Secret not initialized.')
      return callback(err)
    }
    let results = []
    async.each(context.offers, (s, callback) => {
      Evaluator.assessSubject(s, 'commercial', context, (err, subResult) => {
        if (err) {
          return callback(err)
        }
        results.push(subResult)
        return callback()
      })
    }, async (err) => {
      if (err) {
        return callback(err)
      }
      return callback(null, results)
    })
  },

  /**
   * Merges the results from commercial and technical eligibility assessment
   */
  merge: (context, level, commResults, techResults, callback) => {
    log.info('Orchestrator merge', {
      body: context,
      level,
      commResults,
      techResults
    })

    // map tech results
    if (Array.isArray(techResults)) {
      try {
        techResults = tools.arrayToObject(techResults, 'code')
      } catch (err) {
        callback(err)
      }
    }

    if (Array.isArray(commResults)) {
      try {
        commResults = tools.arrayToObject(commResults, 'code')
      } catch (err) {
        callback(err)
      }
    }

    var err, assessments, products, functionalities, iseligible
    switch (level) {
      case 'AssessFunctionalities':
        err = new Error('commercial services only support commercial services')
        err.statusCode = 400
        return callback(err)
      case 'AssessProducts':
        assessments = []
        context.products.forEach((pr) => {
          var csId = pr.id
          iseligible = commResults[csId].iseligible
          var description = commResults[csId].description
          functionalities = []
          pr.functionalities.forEach((sf) => {
            iseligible = iseligible && techResults[sf.PSAFeatureCode].iseligible
            functionalities.push({
              code: sf.PSAFeatureCode,
              iseligible: techResults[sf.PSAFeatureCode].iseligible,
              description: techResults[sf.PSAFeatureCode].description
            })
          })
          log.info('Assessed product', {
            product: pr.id,
            assessment: {
              code: csId,
              iseligible: iseligible,
              description: description,
              functionalities: functionalities
            }
          })
          assessments.push({
            code: csId,
            iseligible: iseligible,
            description: description,
            functionalities: functionalities
          })
        })
        return callback(null, assessments)
      case 'AssessBundles':
        assessments = []
        context.bundles.forEach((b) => {
          var bId = b.id
          var iseligible = true
          products = []
          b.products.forEach((pr) => {
            var csId = pr.id
            iseligible = iseligible && commResults[csId].iseligible
            var product = {
              code: csId,
              iseligible: commResults[csId].iseligible,
              description: commResults[csId].description,
              functionalities: []
            }
            pr.functionalities.forEach((sf) => {
              iseligible = iseligible && techResults[sf.PSAFeatureCode].iseligible
              product.functionalities.push({
                code: sf.PSAFeatureCode,
                iseligible: techResults[sf.PSAFeatureCode].iseligible,
                description: techResults[sf.PSAFeatureCode].description
              })
            })
            products.push(product)
          })
          assessments.push({
            code: bId,
            iseligible: iseligible,
            products: products
          })
        })
        return callback(null, assessments)
      default:
        err = new Error('Invalid service level')
        err.statusCode = 400
        return callback(err)
    }
  },

  /**
   * Evaluates paths (json path) to get the required variable from context
   * @deprecated
   * @param {object} context request body
   * @param {string} path json path
   */
  eval: (context, path) => {
    return safeEval(path, {
      '$': context
    })
  }
}

module.exports = Orchestrator
