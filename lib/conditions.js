'use-strict'

const async = require('async')
const safeEval = require('notevil')
const log = require('sams-js-submodules').samsLoggerJs
const SchemaValidator = new (require('sams-js-submodules').SamsSchemaValidator)()
const Operators = require('./operators')
const Dictionary = require('./dictionary')

/**
 * Module implements a handler to work with conditions
 */
const Conditions = {
  initialized: false,
  validatorOpts: null,
  /**
   * Initializes SamsSchemaValidator and Dictionary module
   */
  init: async () => {
    if (Conditions.initialized) {
      log.info('Conditions:init Already intialized. Skipping')
      return
    }
    await Conditions.initSchemaValidator()
    await Dictionary.init()
    Conditions.initialized = true
  },

  initSchemaValidator: async () => {
    if (Conditions.validatorOpts) {
      log.info('Conditions:initSchemaValidator Already intialized. Skipping')
      return
    }
    Conditions.validatorOpts = {
      local: false,
      s3: {
        region: process.env.REGION,
        bucket: process.env.S3_ELIGIBILITY_SCHEMA_BUCKET_NAME
      }
    }
    if (process.env.STAGE === 'localhost') {
      Conditions.validatorOpts.s3.endpoint = process.env.S3_ENDPOINT
      Conditions.validatorOpts.s3.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_KEY_ID
      }
    }
    await SchemaValidator.init(Conditions.validatorOpts)
  },

  /**
   * Resets Conditions module initialization and depending module: Dictionary
   */
  reset: () => {
    Conditions.initialized = false
    Dictionary.reset()
  },

  /**
   * Assess if the given object is a condition
   * @param {*} object condition object
   * @returns {boolean}
   */
  isCondition: (object) => {
    let isValid = SchemaValidator.validateSync('condition.schema.json#/definitions/condition', object)
    if (!isValid) {
      log.warn('Schema validation error', {
        entity: object,
        schemaName: 'condition.schema.json#/definitions/condition'
      })
    }
    return isValid
  },

  /**
   * Assess if the given object is a nested condition
   * @param {*} object conditions object
   * @returns {boolean}
   */
  isNestedCondition: (object) => {
    let isValid = SchemaValidator.validateSync('conditions.schema.json#/definitions/conditions', object)
    if (!isValid) {
      log.warn('Schema validation error', {
        entity: object,
        schemaName: 'conditions.schema.json#/definitions/conditions'
      })
    }
    return isValid
  },

  /**
   * Evaluates condition.
   * @param {*} context request body
   * @param {*} condition condition object
   * @param {string} type eligibility type
   * @param {function} callback
   * @param {*} stack evaluation stack
   */
  evaluate: (context, condition, type, callback, stack) => {
    if (Conditions.isCondition(condition)) {
      Conditions.evalSimpleCondition(context, condition, type, callback, stack)
    } else if (Conditions.isNestedCondition(condition)) {
      Conditions.evalNestedCondition(context, condition, type, callback, stack)
    } else {
      var err = new Error('Invalid condition')
      err.statusCode = 400
      return callback(err)
    }
  },

  /**
   * Helper function prepare simple condition for translation
   * @param {*} context request body
   * @param {*} condition condition object
   * @param {string} type eligibility type
   * @param {function} callback
   * @param {*} stack evaluation stack
   */
  evalSimpleCondition: (context, condition, type, callback, stack) => {
    log.debug('Evaluating simple condition ', {
      condition,
      context
    })
    Dictionary.getDefinition(condition.label, type, (err, def) => {
      if (err) {
        return callback(err)
      }
      // continue on condition's evaluation
      let t = Conditions.translate(condition, def)
      let evalResult
      try {
        evalResult = Conditions.eval(context, t)
        stack.push({
          condition: t,
          result: evalResult
        })
      } catch (err) {
        evalResult = false
        stack.push({
          condition: t,
          result: false,
          error: err
        })
      }
      return callback(null, evalResult)
    })
  },

  /**
   * Helper function to transform condition's operator
   * @param {*} condition condition object
   * @param {*} labelDef label's definition
   * @returns {string} string for a final evaluation
   */
  translate: (condition, labelDef) => {
    let value = condition.value
    log.debug('Translates condition with label definition', {
      condition,
      labelDef
    })
    switch (condition.operator) {
      case '===':
        // fallthrough
      case '!==':
        // fallthrough
      case '>':
        // fallthrough
      case '<':
        if (labelDef.type === 'string' || labelDef.type === 'array') {
          value = '\'' + condition.value + '\''
        }
        return Operators.simpleOperation(labelDef, condition, value)
      case 'includes':
        return Operators.includeOrExclude(labelDef, value, Operators.simpleInclusion, Operators.nestedInclusion)
      case 'excludes':
        return Operators.includeOrExclude(labelDef, value, Operators.simpleExclusion, Operators.nestedExclusion)
      case 'contains':
        return Operators.contains(labelDef, value)
      case 'not_contains':
        return Operators.notContains(labelDef, value)
      default:
        throw TypeError(`Not supported operator: ${condition.operator}`)
    }
  },

  /**
   * Helper function to split and evaluates a nested condition
   * @param {*} context request body
   * @param {*} nCondition n-th condition object
   * @param {string} type eligibility type
   * @param {function} callback
   * @param {*} stack evaluation stack
   */
  evalNestedCondition: (context, nCondition, type, callback, stack) => {
    log.debug('Evaluating nested conditions', {
      nestedConditions: nCondition,
      context
    })
    async.waterfall([
      (callback) => {
        async.mapSeries(nCondition.conditions, (c, callback) => {
          Conditions.evaluate(context, c, type, callback, stack)
        }, callback)
      },
      (evaluatedList, callback) => {
        log.debug('Nested conditions list', {evaluatedList})
        let t = ''
        if (evaluatedList.length === 1) {
          // in case of single condition return its eval result
          t = evaluatedList[0]
          if (typeof t === 'boolean') {
            return callback(null, t)
          }
        } else {
          // in case of multiple sub-conditions, merge them for final eval
          for (var i = 0, len = evaluatedList.length; i < len; i++) {
            if (i === 0) {
              t += '(' + evaluatedList[i] + ' ' + nCondition.operator
            } else if (i === len - 1) {
              t += ' ' + evaluatedList[i] + ')'
            } else {
              t += evaluatedList[i] + ' ' + nCondition.operator
            }
          }
        }
        log.debug('Merge nested conditions', {mergedCondition: t, stack})
        let evalResult
        try {
          evalResult = Conditions.eval(context, t)
          stack.push({
            condition: t,
            result: evalResult
          })
        } catch (err) {
          evalResult = false
          stack.push({
            condition: t,
            result: false,
            error: err
          })
        }
        log.debug('Merged condition eval result', {result: evalResult})
        return callback(null, evalResult)
      }
    ], callback)
  },

  /**
   * Helper function to evaluates a condition depending on the given context object
   * @param {any} context request body
   * @param {string} tcondition translated condition
   * @returns {boolean}
   */
  eval: (context, tcondition) => {
    let result
    try {
      result = safeEval(tcondition, {
        '$': context
      })
    } catch (err) {
      log.error('Rule evaluation failed', {
        err,
        context,
        tcondition
      })
      throw err
    }
    return result
  }
}

module.exports = {
  init: Conditions.init,
  isCondition: Conditions.isCondition,
  isNestedCondition: Conditions.isNestedCondition,
  evaluate: Conditions.evaluate,
  reset: Conditions.reset
}
