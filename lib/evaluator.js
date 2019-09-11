'use-strict'

const async = require('async')
const log = require('sams-js-submodules').samsLoggerJs
const Rules = require('./rules')
const Conditions = require('./conditions')
const Cache = require('./cache')

/**
 * Module implements business logic for assessing single subject or single rule tag.
 * Subject may be a "product" or an "offer".
 */
const Evaluator = {
  /**
   * Initializes Cache, Rules and Conditions modules (async)
   */
  init: async () => {
    await Cache.init()
    await Rules.init()
    await Conditions.init()
  },

  /**
   * Resets depending modules: Rules, Conditions and Cache
   */
  reset: () => {
    Rules.reset()
    Conditions.reset()
    Cache.reset()
  },

  /**
   * Assesses single subject
   * @param {*} subject product or offer
   * @param {string} type eligibility type
   * @param {*} context request body
   * @param {*} callback
   */
  assessSubject: (subject, type, context, callback) => {
    var id = subject.ruleTag
    var responseId = subject.id
    async.waterfall([
      async () => {
        // no ruleTag defined, return eligible
        if (!id) {
          let res = {
            iseligible: true,
            code: responseId,
            description: [{
              rule: undefined,
              result: true,
              stack: [],
              error: new Error('Entity does not have a rule tag')
            }]
          }
          return [true, null, res]
        }
        let ruleTags = id.split(',').map(str => str.trim())
        return [false, ruleTags.filter(rt => rt && rt.length > 0), null]
      },
      async ([skip, ruleTags, response]) => {
        if (skip) {
          return response
        }
        return new Promise((resolve, reject) => {
          async.map(ruleTags, (ruleTag, callback) => {
            return Evaluator.assessSingleRuleTag(type, context, responseId, ruleTag, callback)
          }, (err, evalRes) => {
            if (err) {
              return reject(err)
            }
            let result
            if (evalRes.length > 1) {
              log.info('Multiple rule tags were evaluated', evalRes)
              // assess end result (based on each rule evaluation)
              result = Evaluator.mergeMultipleTags(evalRes)
            } else {
              log.info('Single rule tag was evaluated', evalRes)
              let singleResult = evalRes[0]
              result = {
                iseligible: singleResult.iseligible || false,
                code: singleResult.code,
                description: [{
                  rule: singleResult.ruleTag,
                  result: singleResult.iseligible,
                  stack: singleResult.stack || [],
                  error: singleResult.error
                }]
              }
            }
            return resolve(result)
          })
        })
      }
    ], callback)
  },

  /**
   * Assess single rule tag by processing it against the given context.
   * @param {string} type eligibility type
   * @param {*} context request body
   * @param {string} refId id of the subject
   * @param {string} ruleTag single rule tag
   * @param {*} callback
   */
  assessSingleRuleTag: (type, context, refId, ruleTag, callback) => {
    log.info('Assessing single rule tag', {
      refId,
      ruleTag,
      context
    })
    if (ruleTag.length === 0) {
      return callback(null, {
        code: refId,
        ruleTag: ruleTag,
        iseligible: false,
        error: new Error('Rule tag is empty string')
      })
    }
    async.waterfall([
      (callback) => {
        Rules.getRule(ruleTag, type, callback)
      },
      (rule, callback) => {
        if (!rule) {
          return callback(null, true, {
            code: refId,
            ruleTag: ruleTag,
            iseligible: false,
            error: new Error('Rule not found')
          }, null)
        }
        if (rule.status === 'public') {
          return callback(null, false, null, rule)
        } else {
          return callback(null, true, {
            code: refId,
            ruleTag: ruleTag,
            iseligible: false,
            error: new Error('Rule is not public')
          }, null)
        }
      },
      (skip, response, rule, callback) => {
        if (skip) {
          return callback(null, response)
        }
        // check the cache for evaluation result
        let cachedResult = Cache.getItem('evaluations', rule.type + rule.ruleTag)
        if (cachedResult) {
          log.debug('Using cached evaluation result', {
            ruleTag: ruleTag,
            cachedEvaluationResult: cachedResult
          })
          // update subject reference
          cachedResult.code = refId
          return callback(null, cachedResult)
        }
        let stack = []
        Conditions.evaluate(context, rule.conditions, type, (err, result) => {
          log.info('Rule evaluation finished', {
            result: result
          })
          let evl
          if (err) {
            stack.push(err)
            evl = {
              code: refId,
              ruleTag: ruleTag,
              iseligible: false,
              stack: stack,
              error: err
            }
          } else {
            evl = {
              code: refId,
              ruleTag: ruleTag,
              iseligible: rule.overall ? result : !result,
              stack: stack
            }
          }
          // put evaluation result to the cache
          try {
            log.debug('Caching rule\'s evaluation result', {
              ruleTag: ruleTag,
              evaluationResult: evl
            })
            Cache.setItem('evaluations', rule.type + rule.ruleTag, evl)
          } catch (err) {
            log.error('Error while caching evaluation result', {
              err,
              ruleTag: ruleTag,
              evaluationResult: evl
            })
            callback(err)
          }
          return callback(null, evl)
        }, stack)
      }
    ], callback)
  },

  /**
   * Merges mutiple tags by operating AND operation between their result
   * @param {} resultArray
   */
  mergeMultipleTags: (resultArray) => {
    return resultArray.reduce((result, item) => {
      result.code = item.code
      result.iseligible = result.iseligible && item.iseligible
      result.description.push({
        rule: item.ruleTag,
        result: item.iseligible,
        stack: item.stack || [],
        error: item.error
      })
      return result
    }, {
      iseligible: true,
      description: []
    })
  }
}

module.exports = Evaluator
