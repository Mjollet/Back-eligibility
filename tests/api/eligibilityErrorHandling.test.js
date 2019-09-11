'use strict'
/* global jest, describe, expect, test, jest, afterEach */
jest.unmock('request')

const jestPlugin = require('serverless-jest-plugin')
const zlib = require('zlib')

const eligiblityL = require('../../services/eligibility')

const simulator = require('../../lib/simulator/simulator')
const rules = require('../../lib/rules')

const lambdaWrapper = jestPlugin.lambdaWrapper

const wrappedEligibility = lambdaWrapper.wrap(eligiblityL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})

describe('Error handling', () => {
  describe('general Errors', () => {
    test('should catch null type param and respond with error message', (done) => {
      const type = null
      const level = 'AssessProducts'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      wrappedEligibility.run(event, (err, response) => {
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(404)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('Bad Request: missing type and/or level param(s) in the path')
        done()
      })
    })
    test('should catch null level param and respond with error message', (done) => {
      const type = 'commercial'
      const level = null
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      wrappedEligibility.run(event, (err, response) => {
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(404)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('Bad Request: missing type and/or level param(s) in the path')
        done()
      })
    })
  })
  describe('rule errors', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should catch generic rules error and respond 500', (done) => {
      const type = 'commercial'
      const level = 'AssessProducts'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      jest.spyOn(rules, 'getRule').mockImplementation((foo, bar, cb) => cb(new Error('rules error mock')))
      wrappedEligibility.run(event, (err, response) => {
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(500)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('rules error mock')
        done()
      })
    })
    test('should catch non-existing rule error and respond with "Not Found"', (done) => {
      const type = 'commercial'
      const level = 'AssessProducts'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      jest.spyOn(rules, 'getRule').mockImplementation((ruleTag, type, cb) => cb(null, undefined))
      wrappedEligibility.run(event, (err, response) => {
        expect(err).toBeNull()
        expect(response).toBeDefined()
        expect(response.statusCode).toBe(200)
        // decode response body
        let buffer = Buffer.from(response.body, 'base64')
        zlib.gunzip(buffer, (_err, bufferInflate) => {
          if (!_err) {
            let body = JSON.parse(bufferInflate.toString('utf8'))
            expect(body).toMatchObject([{
              code: 'testProductID',
              description: [{
                'result': false,
                'rule': 'commercial_service_rule',
                'stack': [],
                'error': {
                  'message': 'Rule not found'
                }
              }]
            }])
            done()
          } else {
            throw _err
          }
        })
      })
    })
    test.skip('should catch rule evaluation error and respond with "Invalid condition"', (done) => {
      const type = 'commercial'
      const level = 'AssessProducts'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      jest.spyOn(rules, 'evaluate').mockImplementation((context, condition, type, cb, stack) => {
        let err = new Error('Invalid condition')
        err.statusCode = 400
        cb(err)
      })
      wrappedEligibility.run(event, (err, response) => {
        let log = err || response
        console.log(log)
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(400)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('Invalid condition')
        done()
      })
    })
    test('should not evaluate non-public rules and fallback to "Rule not found"', (done) => {
      const type = 'commercial'
      const level = 'AssessProducts'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      jest.spyOn(rules, 'getRule').mockImplementation((ruleTag, type, cb) => {
        cb(null, {
          ruleTag: 'customer_from_france',
          overall: true,
          conditions: {},
          type: 'commercial',
          status: 'anything-not-public'
        })
      })
      wrappedEligibility.run(event, (err, response) => {
        expect(err).toBeNull()
        expect(response).toBeDefined()
        expect(response.statusCode).toBe(200)
        // decode response body
        let buffer = Buffer.from(response.body, 'base64')
        zlib.gunzip(buffer, (_err, bufferInflate) => {
          if (!_err) {
            let body = JSON.parse(bufferInflate.toString('utf8'))
            expect(body).toMatchObject([{
              code: 'testProductID',
              description: [{
                'result': false,
                'rule': 'commercial_service_rule',
                'stack': [],
                'error': {
                  'message': 'Rule is not public'
                }
              }]
            }])
            done()
          } else {
            throw _err
          }
        })
      })
    })
  })
  describe('schema errors', () => {
    test('should validate against generic eligibility schema and respond with error message', (done) => {
      const type = 'commercial'
      const level = 'AssessProducts'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createIrregularPayload(type, level, 'products-not-array'))
      })
      wrappedEligibility.run(event, (err, response) => {
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(400)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('Bad Request')
        done()
      })
    })
  })
  describe('url errors', () => {
    test('should catch non-existig level and respond with error message', (done) => {
      const type = 'commercial'
      const level = 'AssessFoo'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      wrappedEligibility.run(event, (err, response) => {
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(404)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('Bad Request')
        done()
      })
    })
    test('should catch non-existing type while assessing functionalities and respond with error message', (done) => {
      const type = 'foo'
      const level = 'AssessFunctionalities'
      let event = simulator.createEvent({
        resource: '/eligibility/{type}/{level}',
        method: 'POST',
        path: `/eligibility/${type}/${level}`,
        pathParameters: {
          type: type,
          level: level
        },
        body: JSON.stringify(simulator.createComEligPayload())
      })
      wrappedEligibility.run(event, (err, response) => {
        expect(response).toBeDefined()
        expect(err).toBeNull()
        expect(response.statusCode).toBe(404)
        let body = JSON.parse(response.body)
        expect(body.message).toBe('Bad Request')
        done()
      })
    })
  })
})
