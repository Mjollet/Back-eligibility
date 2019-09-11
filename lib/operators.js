'use-strict'
/**
 * Module contains a set of functions to handle SAMS operators
 */
const Operators = {
  /**
   * Helper function to construct string from simple condition ( OP1 OPERATOR OP2).
   * First operand (OP1) will be taken from the label's definition.
   * @param {*} labelDef labels' definition object
   * @param {*} condition condition object
   * @param {*} value a value which will be used in the condition as a second operand (OP2)
   * @returns {string} evaluation string
   */
  simpleOperation: (labelDef, condition, value) => {
    return '(' + labelDef.symbol + ' ' + condition.operator + ' ' + value + ')'
  },

  /**
   * Helper function to construct include and exclude operation
   * @param {*} labelDef label's definition object
   * @param {*} value a value which is is used for condition assessment
   * @param {function} cb1 callback to be called if label refers to an array of primitive values
   * @param {function} cb2 callback to be called if label refers to an array of objects
   */
  includeOrExclude: (labelDef, value, cb1, cb2) => {
    if (labelDef.type === 'array') {
      return cb1(labelDef, value)
    } else if (labelDef.type === 'objectArray') {
      return cb2(labelDef, value)
    } else throw TypeError('Cannot perform inclusion or exclusion operation on another type than "array" or "objectArray"')
  },
  /**
   * Helper function to construct evaluation string for "contains" operator.
   * Based on target referenced by label's definition, if target's type is:
   *  - string - constructs a condition that checks if target is a subset of the input array
   *  - array - constructs a condition that checks if input is a subset of target array
   * @param {*} labelDef label's definition object
   * @param {*[]} input an array of input values for evaluation
   * @returns {string} evaluation string
   */
  contains: (labelDef, input) => {
    if (input.length && input.length === 0) {
      throw TypeError('Cannot perform "contains" operation using empty array as input')
    }
    switch (labelDef.type) {
      case 'string':
        // input includes value from the array referenced by labelDef (target is a subset of the input array)
        return `(${JSON.stringify(input)}.includes(${labelDef.symbol}))`
      case 'array':
        // every input item is included in the array referenced by labelDef (input is a subset of target array)
        return `(${JSON.stringify(input)}.filter(item => ${labelDef.symbol}.includes(item)).length === ${JSON.stringify(input)}.length)`
      case 'object':
        // fall through
      case 'objectArray':
        throw TypeError('operator "contains" is not supported on objects or objectArrays')
    }
  },
  /**
   * Helper function to construct evaluation string for "not contains" operator.
   * Based on target referenced by label's definition, if target's type is:
   *  - string - constructs a condition that checks if target is not a subset of the input array
   *  - array - constructs a condition that checks if input is not a subset of target array
   * @param {*} labelDef label's definition object
   * @param {*[]} input an array of input values for evaluation
   * @returns {string} evaluation string
   */
  notContains: (labelDef, input) => {
    if (input.length && input.length === 0) {
      throw TypeError('Cannot perform "not contains" operation using empty array as input')
    }
    switch (labelDef.type) {
      case 'string':
        // input not includes value from the array referenced by labelDef (target is not a subset of the input array)
        return `(!${JSON.stringify(input)}.includes(${labelDef.symbol}))`
      case 'array':
        // every input item is included in the array referenced by labelDef (input is not a subset of target array)
        return `(${JSON.stringify(input)}.filter(item => ${labelDef.symbol}.includes(item)).length === 0)`
      case 'object':
        // fall through
      case 'objectArray':
        throw TypeError('operator "not contains" is not supported on objects or objectArrays')
    }
  },
  /**
   * Helper function to construct evaluation string for "includes" operator.
   * Tests if the value is contained in the target array referenced by label's definition.
   * @param {*} labelDef label's definition with a symbol property refering to an array of primitive values
   * @param {*} value input value (primitive)
   * @returns {string} evaluation string
   */
  simpleInclusion: (labelDef, value) => {
    return '(' + labelDef.symbol + '.indexOf(' + value + ') > -1)'
  },

  /**
   * Helper function to construct evaluation string for "includes" operator.
   * Tests if the value is contained in the target array referenced by label's definition.
   * @param {*} labelDef label's definition with a symbol property refering to an array of objects
   * @param {*} value input value (object)
   * @returns {string} evaluation string
   */
  nestedInclusion: (labelDef, value) => {
    if (typeof value !== 'object') {
      throw new TypeError('Value is not an object')
    }

    var tmpVal = `${labelDef.symbol}.filter(function(obj) {
      let log = []
      Object.keys(${JSON.stringify(value)}).forEach(function (key) {
        if (obj[key] === ${JSON.stringify(value)}[key]) {
          log.push(true)
        } else {
          log.push(false)
        }
      })
      if (log.includes(false)) {
        return false
      } else {
        return true
      }
    })`

    return '(' + tmpVal + '.length > 0)'
  },

  /**
   * Helper function to construct evaluation string for "excludes" operator.
   * Tests if the value is not contained in the target array referenced by label's definition.
   * @param {*} labelDef label's definition with a symbol property refering to an array of primitive values
   * @param {*} value input value (primitive)
   * @returns {string} evaluation string
   */
  simpleExclusion: (labelDef, value) => {
    return '(' + labelDef.symbol + '.indexOf(' + value + ') === -1)'
  },

  /**
   * Helper function to construct evaluation string for "excludes" operator.
   * Tests if the value is not contained in the target array referenced by label's definition.
   * @param {*} labelDef label's definition with a symbol property refering to an array of primitive values
   * @param {*} value input value (primitive)
   * @returns {string} evaluation string
   */
  nestedExclusion: (labelDef, value) => {
    if (typeof value !== 'object') {
      throw new TypeError('Value is not an object')
    }

    var tmpVal = `${labelDef.symbol}.filter(function(obj) {
      let log = []
      Object.keys(${JSON.stringify(value)}).forEach(function (key) {
        if (obj[key] === ${JSON.stringify(value)}[key]) {
          log.push(true)
        } else {
          log.push(false)
        }
      })
      if (log.includes(false)) {
        return false
      } else {
        return true
      }
    })`

    return '(' + tmpVal + '.length === 0)'
  }
}

module.exports = Operators
