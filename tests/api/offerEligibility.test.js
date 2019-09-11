'use strict'
/* global jest, describe, expect, test */
jest.unmock('request')

const jestPlugin = require('serverless-jest-plugin')
const zlib = require('zlib')

const eligiblityL = require('../../services/eligibility')

const simulator = require('../../lib/simulator/simulator')

const lambdaWrapper = jestPlugin.lambdaWrapper
const wrappedEligibility = lambdaWrapper.wrap(eligiblityL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})

const type = 'commercial'

describe('Offer Eligibility', () => {
  test('should assess single offer with a ruleTag', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/commercial/AssessOffers',
      pathParameters: {
        type: type,
        level: 'AssessOffers'
      },
      body: JSON.stringify(simulator.createOfferPayload())
    })
    wrappedEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      done()
    })
  })
  test('should not assess single offer without a ruleTag', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/commercial/AssessOffers',
      pathParameters: {
        type: type,
        level: 'AssessOffers'
      },
      body: JSON.stringify(simulator.createOfferNoRuleTagPayload())
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
          expect(body[0].iseligible).toBe(true)
          expect(body[0].description[0].stack).toMatchObject([])
          expect(body[0].description[0].error.message).toBe('Entity does not have a rule tag')
          done()
        } else {
          throw _err
        }
      })
    })
  })
})
