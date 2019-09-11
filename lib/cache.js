'use-strict'
/**
 * Module implements in memory cache for a single eligibility request
 * @prop {*} rules        - cached rules
 * @prop {*} evaluations  - cached evaluations
 * @prop {*} definitions  - cached definitions
 */
const Cache = {
  rules: {}, // INDEX by type and ruleTag
  evaluations: {}, // INDEX BY composed condition string
  definitions: {}, // INDEX by type and ruleTag

  /**
   * Resets only evaluations cache
   */
  init: () => {
    Cache.rules = {}
    Cache.definitions = {}
    Cache.evaluations = {}
  },

  /**
   * Resets rules, evaluations and definitions cache
   */
  reset: () => {
    Cache.evaluations = {}
    Cache.rules = {}
    Cache.definitions = {}
  },

  /**
   * Put item into the Cache
   * one of the types: rules, definitions, evaluations
   * @param {string} type one of the cache types: rules, evaluations or definitions
   * @param {string} key unique cache entry key combined from values of eligiblity type and rule tag
   * @param {*} value value to be put into cache
   */
  setItem: (type, key, value) => {
    if (value === undefined) {
      throw new Error('missing value to be cached')
    }
    if (!Cache[type][key]) {
      Cache[type][key] = value
    }
  },

  /**
   * Get item from the Cache
   * one of the types: rules, definitions, evaluations
   * @param {string} type one of the cache types: rules, evaluations or definitions
   * @param {string} key unique cache entry key combined from values of eligiblity type and rule tag
   * @returns {*} cached value
   */
  getItem: (type, key) => {
    if (Cache[type][key]) {
      return Cache[type][key]
    } else {
      return null
    }
  }
}

module.exports = Cache
