'use strict'
/* global jest, beforeAll, describe, expect, test */
jest.unmock('request')

const jestPlugin = require('serverless-jest-plugin')

const eligiblityL = require('../../services/orchestrate')

const simulator = require('../../lib/simulator/simulator')

const lambdaWrapper = jestPlugin.lambdaWrapper
const wrappedEligibility = lambdaWrapper.wrap(eligiblityL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})

beforeAll(() => {
  // set timeout for each test case to 60 secs
  jest.setTimeout(60 * 1000)
})

describe('Service: orchestrate (global eligibility)', () => {
  test('should assess the list of bundles', (done) => {
    var event = simulator.createEvent({
      resource: 'global/eligibility/{workflow}/{level}',
      method: 'POST',
      path: 'global/eligibility/global/AssessBundles',
      pathParameters: {
        workflow: 'global',
        level: 'AssessBundles'
      },
      body: JSON.stringify(simulator.createGlobalBundlesPayload())
    })
    wrappedEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })

  test('should assess the list of "products"', (done) => {
    var event = simulator.createEvent({
      resource: 'global/eligibility/{workflow}/{level}',
      method: 'POST',
      path: 'global/eligibility/commercial/AssessProducts',
      pathParameters: {
        workflow: 'commercial',
        level: 'AssessProducts'
      },
      body: JSON.stringify(simulator.createGlobalProductsPayload())
    })
    wrappedEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })

  test('should assess the list of "functionalities"', (done) => {
    var event = simulator.createEvent({
      resource: 'global/eligibility/{workflow}/{level}',
      method: 'POST',
      path: 'global/eligibility/technical/AssessFunctionalities',
      pathParameters: {
        workflow: 'technical',
        level: 'AssessFunctionalities'
      },
      body: JSON.stringify(simulator.createGlobalFunctionalitiesPayload())
    })
    wrappedEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })

  test('should assess the list of offers', (done) => {
    // Overrride workflow
    var event = simulator.createEvent({
      resource: 'global/eligibility/{workflow}/{level}',
      method: 'POST',
      path: 'global/eligibility/commercial/AssessOffers',
      pathParameters: {
        workflow: 'commercial',
        level: 'AssessOffers'
      },
      body: JSON.stringify(simulator.createOffersPayload())
    })
    wrappedEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })
})
