'use strict'
/* global jest, beforeAll, describe, expect, test */
jest.unmock('request')

const jestPlugin = require('serverless-jest-plugin')
const zlib = require('zlib')

const techEligiblityL = require('../../services/technical-eligibility')

const simulator = require('../../lib/simulator/simulator')

const lambdaWrapper = jestPlugin.lambdaWrapper
const wrappedTechEligibility = lambdaWrapper.wrap(techEligiblityL, {
  region: process.env.AWS_DYNAMODB_REGION,
  handler: 'handler'
})

const type = 'technical'

beforeAll(() => {
  // set timeout for each test case to 60 secs
  jest.setTimeout(60 * 1000)
})

describe('Technical eligibility', () => {
  test('should assess single functionality', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/technical/AssessMuse',
      pathParameters: {
        type: type,
        level: 'AssessMuse'
      },
      body: JSON.stringify({
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'store': {
          'language': 'FR',
          'level': 'info',
          'origin': 'DS',
          'audience': 'B2C'
        },
        'customer': {
          'uuid': 'testCustomerID'
        },
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      })
    })
    wrappedTechEligibility.run(event, (err, response) => {
      expect(err).toBeNull()
      expect(response).toBeDefined()
      expect(response.statusCode).toBe(200)
      // decode response body
      let buffer = Buffer.from(response.body, 'base64')
      zlib.gunzip(buffer, (_err, bufferInflate) => {
        if (!_err) {
          let body = JSON.parse(bufferInflate.toString('utf8'))
          expect(body).toMatchObject([{
            'code': 'NAL01',
            'iseligible': true,
            'description': [{
              'rule': '__AssessMUSE',
              'shortLabel': 'Connected NAV',
              'result': true,
              'stack': [{
                'condition': '__PSAFeatureCodeAssessment',
                'result': true
              }]
            }]
          }])
          done()
        } else {
          throw _err
        }
      })
    })
  })

  test('should assess multiple functionalities', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/technical/AssessMuse',
      pathParameters: {
        type: type,
        level: 'AssessMuse'
      },
      body: JSON.stringify(simulator.createTechFunctionalitiesSetAPayload())
    }) // Cloning the template
    wrappedTechEligibility.run(event, (err, response) => {
      expect(err).toBeNull()
      expect(response).toBeDefined()
      expect(response.statusCode).toBe(200)
      // decode response body
      let buffer = Buffer.from(response.body, 'base64')
      zlib.gunzip(buffer, (_err, bufferInflate) => {
        if (!_err) {
          let body = JSON.parse(bufferInflate.toString('utf8'))
          expect(body).toMatchObject([{
            'code': 'NAL01',
            'iseligible': true,
            'description': [{
              'rule': '__AssessMUSE',
              'shortLabel': 'Connected NAV',
              'result': true,
              'stack': [{
                'condition': '__PSAFeatureCodeAssessment',
                'result': true
              }]
            }]
          },
          {
            'code': 'NAX01',
            'iseligible': false,
            'description': [{
              'rule': '__AssessMUSE',
              'shortLabel': 'Map incremental update OTA',
              'result': false,
              'stack': [{
                'condition': '__PSAFeatureCodeAssessment',
                'result': false
              }]
            }]
          }
          ])
          done()
        } else {
          throw _err
        }
      })
    })
  })

  test('should catch unsupported PSA feature code in single functionality', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/technical/AssessMuse',
      pathParameters: {
        type: type,
        level: 'AssessMuse'
      },
      body: JSON.stringify({
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'store': {
          'language': 'FR',
          'level': 'info',
          'origin': 'DS',
          'audience': 'B2C'
        },
        'customer': {
          'uuid': 'testCustomerID'
        },
        'functionality': {
          'PSAFeatureCode': 'NULL01'
        }
      })
    }) // Cloning the template
    wrappedTechEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      // decode response body
      let buffer = Buffer.from(response.body, 'base64')
      zlib.gunzip(buffer, (_err, bufferInflate) => {
        if (!_err) {
          let body = JSON.parse(bufferInflate.toString('utf8'))
          expect(body).toMatchObject([{
            'code': 'NULL01',
            'iseligible': false,
            'description': [{
              'rule': '__AssessMUSE',
              'result': false,
              'stack': [],
              'error': {
                'message': 'Functionality not found'
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

  test('should catch unsupported PSA feature codes in multiple functionalities', (done) => {
    var event = simulator.createEvent({
      resource: '/eligibility/{type}/{level}',
      method: 'POST',
      path: '/eligibility/technical/AssessMuse',
      pathParameters: {
        type: type,
        level: 'AssessMuse'
      },
      body: JSON.stringify(simulator.createTechFunctionalitiesSetBPayload())
    })
    wrappedTechEligibility.run(event, (err, response) => {
      expect(response).toBeDefined()
      expect(err).toBeNull()
      expect(response.statusCode).toBe(200)
      // decode response body
      let buffer = Buffer.from(response.body, 'base64')
      zlib.gunzip(buffer, (_err, bufferInflate) => {
        if (!_err) {
          let body = JSON.parse(bufferInflate.toString('utf8'))
          expect(body).toMatchObject([{
            'code': 'NAL01',
            'iseligible': true,
            'description': [{
              'rule': '__AssessMUSE',
              'shortLabel': 'Connected NAV',
              'result': true,
              'stack': [{
                'condition': '__PSAFeatureCodeAssessment',
                'result': true
              }]
            }]
          },
          {
            'code': 'NULL01',
            'iseligible': false,
            'description': [{
              'rule': '__AssessMUSE',
              'result': false,
              'stack': [],
              'error': {
                'message': 'Functionality not found'
              }
            }]
          }
          ])
          done()
        } else {
          throw _err
        }
      })
    })
  })
})
