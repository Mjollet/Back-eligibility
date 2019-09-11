'use strict'
/* global jest, describe, expect, test, beforeAll, afterAll */
jest.unmock('request')

const async = require('async')
const jestPlugin = require('serverless-jest-plugin')

const eligiblityL = require('../../services/eligibility')
const addDefinitionL = require('../../services/add-definitions')
const addRulesL = require('../../services/add-rules')

const simulator = require('../../lib/simulator/simulator')
const Dictionary = require('../../lib/dictionary')
const Rules = require('../../lib/rules')

const lambdaWrapper = jestPlugin.lambdaWrapper
const wrappedEligibility = lambdaWrapper.wrap(eligiblityL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})
const wrappedAddDefinition = lambdaWrapper.wrap(addDefinitionL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})
const wrappedAddRules = lambdaWrapper.wrap(addRulesL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})

const type = 'commercial'

const cleanDB = (done) => {
  var definitions = simulator.createDefinitionPayload().definitions
  var commRules = simulator.createComRulePayload().rules
  async.waterfall([
    (callback) => {
      async.eachSeries(definitions, (item, callback) => {
        Dictionary.deleteDefinition(item.label, type, callback)
      }, callback)
    },
    (callback) => {
      async.eachSeries(commRules, (item, callback) => {
        Rules.deleteRule(item.ruleTag, type, callback)
      }, callback)
    }
  ], (err) => {
    if (err) {
      console.error(err)
      done()
    }
    // console.log('Done cleaning.')
    done()
  })
}

describe('Commercial Eligibility Test', () => {
  // setup
  beforeAll(async () => {
    await Rules.init()
  })
  afterAll((done) => {
    cleanDB(done)
  })
  // do tests
  test('Injecting Definitions in the Dictionary', (done) => {
    const event = simulator.createEvent({
      resource: '/dictionary/entry/add',
      method: 'POST',
      path: '/dictionary/entry/add',
      body: JSON.stringify(simulator.createDefinitionPayload())
    })
    wrappedAddDefinition.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })

  test('Injecting ' + type + ' rules ', (done) => {
    const event = simulator.createEvent({
      resource: '/rule/{type}/add',
      method: 'POST',
      path: '/rule/' + type + '/add',
      pathParameters: {
        type: type
      },
      body: JSON.stringify(simulator.createComRulePayload())
    })

    wrappedAddRules.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })

  test('Calling commercial eligibility. should respond 200', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/commercial/AssessProducts',
      pathParameters: {
        type: type,
        level: 'AssessProducts'
      },
      body: JSON.stringify(simulator.createComEligPayload())
    }) // Cloning the template
    wrappedEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })
})
