'use-strict'
/* global jest, afterEach, describe, expect, test */

// set manual mock for request module
jest.mock('request')

const requestMock = require('../../__mocks__/__utils__/requestMock')
const Muse = require('../../lib/muse')
const SecretsManager = require('../../lib/secrets-manager')

describe('Muse', () => {
  afterEach(() => {
    requestMock.reset()
    Muse.reset()
  })
  describe('.assessFunctionalities', () => {
    test('should throw an error if params are not matching the schema', async () => {
      // vehicle is missing subproperties describing a vin
      let body = {
        'vehicle': {},
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      }
      requestMock.responseBody.mockReturnValue(JSON.stringify([{
        code: 'NAL01',
        shortLabel: 'Connected NAV',
        eligible: true
      }
      ]))
      try {
        await Muse.init()
        await Muse.assessFunctionalities(body)
      } catch (err) {
        expect(err).toMatchObject(new Error('Bad Request: vehicle is required'))
      }
    })
    test('should throw an error for invalid context', async () => {
      // context is empty
      let body = {}
      requestMock.responseBody.mockReturnValue(JSON.stringify([{
        code: 'NAL01',
        shortLabel: 'Connected NAV',
        eligible: true
      }
      ]))
      try {
        await Muse.init()
        await Muse.assessFunctionalities(body)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('Bad Request: vehicle is required'))
      }
    })
    test('should evaluate single functionality', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      }
      requestMock.responseBody.mockReturnValue(JSON.stringify([{
        code: 'NAL01',
        shortLabel: 'Connected NAV',
        eligible: true
      }
      ]))
      let expectedResult = {
        'statusCode': 200,
        'body': [
          {
            'code': 'NAL01',
            'iseligible': true,
            'description': [
              {
                'rule': '__AssessMUSE',
                'shortLabel': 'Connected NAV',
                'result': true,
                'stack': [
                  {
                    'condition': '__PSAFeatureCodeAssessment',
                    'result': true
                  }
                ]
              }
            ]
          }
        ]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
    test('should handle request error', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      }
      requestMock.error.mockReturnValue('Mocked request error')
      try {
        await Muse.init()
        await Muse.assessFunctionalities(body)
      } catch (err) {
        expect(err).toBe('Mocked request error')
      }
    })
    test('should handle unsupported PSA feature code in single functionality', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionality': {
          'PSAFeatureCode': 'NULL_00'
        }
      }
      requestMock.responseBody.mockReturnValue(JSON.stringify([{
        code: 'NAL01',
        shortLabel: 'Connected NAV',
        eligible: true
      }
      ]))
      let expectedResult = {
        'statusCode': 200,
        'body': [
          {
            'code': 'NULL_00',
            'iseligible': false,
            'description': [
              {
                'rule': '__AssessMUSE',
                'result': false,
                'stack': [],
                'error': new Error('Functionality not found')
              }
            ]
          }
        ]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
    test('should evaluate a list of functionalities', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionalities': [{
          'PSAFeatureCode': 'NAL01'
        },
        {
          'PSAFeatureCode': 'ZAR01'
        }
        ]
      }
      requestMock.responseBody.mockReturnValue(JSON.stringify([{
        code: 'NAL01',
        shortLabel: 'Navigation',
        eligible: true
      },
      {
        code: 'ZAR01',
        shortLabel: 'Navigation Plus',
        eligible: true
      }
      ]))
      let expectedResult = {
        'statusCode': 200,
        'body': [{
          'code': 'NAL01',
          'iseligible': true,
          'description': [{
            'rule': '__AssessMUSE',
            'result': true,
            'stack': [{
              'condition': '__PSAFeatureCodeAssessment',
              'result': true
            }]
          }]
        },
        {
          'code': 'ZAR01',
          'iseligible': true,
          'description': [{
            'rule': '__AssessMUSE',
            'result': true,
            'stack': [{
              'condition': '__PSAFeatureCodeAssessment',
              'result': true
            }]
          }]
        }
        ]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
    test('should handle unsupported PSA feature code in the list of functionalities', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionalities': [{
          'PSAFeatureCode': 'NAL01'
        },
        {
          'PSAFeatureCode': 'NULL_00'
        }
        ]
      }
      requestMock.responseBody.mockReturnValue(JSON.stringify([{
        code: 'NAL01',
        shortLabel: 'Navigation',
        eligible: true
      }
      ]))
      let expectedResult = {
        'statusCode': 200,
        'body': [{
          'code': 'NAL01',
          'iseligible': true,
          'description': [{
            'rule': '__AssessMUSE',
            'result': true,
            'stack': [{
              'condition': '__PSAFeatureCodeAssessment',
              'result': true
            }]
          }]
        },
        {
          'code': 'NULL_00',
          'iseligible': false,
          'description': [
            {
              'rule': '__AssessMUSE',
              'result': false,
              'stack': [],
              'error': new Error('Functionality not found')
            }
          ]
        }
        ]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
    test('should throw an error if Muse response is not an array', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      }
      // resturn a single object, not an array
      requestMock.responseBody.mockReturnValue(JSON.stringify({
        code: 'NAL01',
        shortLabel: 'Connected NAV',
        eligible: true
      }))
      try {
        await Muse.init()
        await Muse.assessFunctionalities(body)
      } catch (err) {
        expect(err).toMatchObject(new Error('Muse response is not an array'))
      }
    })
    test('should inform about Muse error (single functionality)', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      }
      requestMock.response.mockReturnValue({
        statusCode: 500
      })
      requestMock.responseBody.mockReturnValue(JSON.stringify({
        errorCode: 'CLIENT_ERROR',
        message: '[FSERV] Client error : FSERV parsing error for request id 70'
      }))
      let expectedResult = {
        'statusCode': 200,
        'body': [{
          'code': 'NAL01',
          'iseligible': false,
          'description': [{
            'rule': '__AssessMUSE',
            'result': false,
            'stack': [],
            'error': new Error('Generic Muse error')
          }]
        }]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
    test('should inform about Muse error (multiple functionalities)', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionalities': [{
          'PSAFeatureCode': 'NAL01'
        },
        {
          'PSAFeatureCode': 'ZAR01'
        }
        ]
      }
      requestMock.response.mockReturnValue({
        statusCode: 500
      })
      requestMock.responseBody.mockReturnValue(JSON.stringify({
        errorCode: 'CLIENT_ERROR',
        message: '[FSERV] Client error : FSERV parsing error for request id 70'
      }))
      let expectedResult = {
        'statusCode': 200,
        'body': [{
          'code': 'NAL01',
          'iseligible': false,
          'description': [{
            'rule': '__AssessMUSE',
            'result': false,
            'stack': [],
            'error': {
              'message': 'Generic Muse error'
            }
          }]
        },
        {
          'code': 'ZAR01',
          'iseligible': false,
          'description': [{
            'rule': '__AssessMUSE',
            'result': false,
            'stack': [],
            'error': {
              'message': 'Generic Muse error'
            }
          }]
        }
        ]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
    test('should handle "Bad Gateway" response from Muse', async () => {
      let body = {
        'vehicle': {
          'wmi': 'VR1',
          'vds': 'JCYHZJ',
          'vis': 'HY155744'
        },
        'functionality': {
          'PSAFeatureCode': 'NAL01'
        }
      }
      requestMock.response.mockReturnValue({
        statusCode: 500
      })
      requestMock.responseBody.mockReturnValue('Bad Gateway')
      let expectedResult = {
        'statusCode': 200,
        'body': [{
          'code': 'NAL01',
          'iseligible': false,
          'description': [{
            'rule': '__AssessMUSE',
            'result': false,
            'stack': [],
            'error': {
              'message': 'Generic Muse error'
            }
          }]
        }]
      }
      await Muse.init()
      let result = await Muse.assessFunctionalities(body)
      expect(result).toMatchObject(expectedResult)
    })
  })
  describe('.init', () => {
    test('should load Muse secrets', async () => {
      process.env.STAGE = 'not_localhost'
      SecretsManager.getSecrets = jest.fn((tag, callback) => {
        callback(null, 'mocked secret')
      })
      await Muse.init()
      expect(SecretsManager.getSecrets).toBeCalled()
    })
    test('should load Muse secrets once', async () => {
      process.env.STAGE = 'not_localhost'
      SecretsManager.getSecrets = jest.fn((tag, callback) => {
        callback(null, 'mocked secret')
      })
      await Muse.init()
      await Muse.init()
      expect(SecretsManager.getSecrets).toBeCalledTimes(1)
    })
    test('should handle secrets error', async () => {
      process.env.STAGE = 'not_localhost'
      SecretsManager.getSecrets = jest.fn((tag, callback) => {
        callback(new Error('mocked error'))
      })
      try {
        await Muse.init()
      } catch (err) {
        expect(err).toMatchObject(new Error('mocked error'))
      }
    })
  })
})
