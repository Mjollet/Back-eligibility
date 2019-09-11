'use-strict'

const Orchestrator = require('./lib/orchestrator')
const Evaluator = require('./lib/evaluator')

/**
 * Module **sams-eligibility** implements rules engine which evaluates commercial and/or technical eligibility.
 * It also exposes some utility functions to be used as API in other sams apps like **sams-catalog**
 */
module.exports = {
  Orchestrator,
  Evaluator
}
