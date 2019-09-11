'use strict'
/* global describe, expect, test */
const AWS = require('aws-sdk-mock')
const SecretsManager = require('../../lib/secrets-manager')

describe('SecretsManager', () => {
  test('should return secrets object', (done) => {
    let secretTag = `develop/eligibility/eligibility`
    let secretsResponseMock = {
      ARN: 'arnString',
      CreatedDate: 1537777045987,
      Name: 'nameString',
      SecretString: '{"secretId": "secretValue"}',
      VersionId: 'someVersionId',
      VersionStages: [ 'someVersionStage' ]
    }
    AWS.mock('SecretsManager', 'getSecretValue', function (params, callback) {
      callback(null, secretsResponseMock)
    })
    SecretsManager.getSecrets(secretTag, (err, eligibilitySecrets) => {
      expect(err).toBe(null)
      expect(eligibilitySecrets).toBeDefined()
      expect(eligibilitySecrets).toMatchObject({ 'secretId': 'secretValue' })
      AWS.restore('SecretsManager', 'getSecretValue')
      done()
    })
  })
  test('should handle secrets parsing error, e.g. empty string', (done) => {
    let secretTag = `develop/eligibility/eligibility`
    let secretsResponseMock = {
      ARN: 'arnString',
      CreatedDate: 1537777045987,
      Name: 'nameString',
      SecretString: '',
      VersionId: 'someVersionId',
      VersionStages: [ 'someVersionStage' ]
    }
    AWS.mock('SecretsManager', 'getSecretValue', function (params, callback) {
      callback(null, secretsResponseMock)
    })
    SecretsManager.getSecrets(secretTag, (err, eligibilitySecrets) => {
      expect(err).toBeDefined()
      expect(err).toMatchObject(new Error('SecretString is empty'))
      expect(eligibilitySecrets).not.toBeDefined()
      AWS.restore('SecretsManager', 'getSecretValue')
      done()
    })
  })

  test('should catch json parse error', (done) => {
    let secretTag = '`develop/eligibility/eligibility`'
    let secretsResponseMock = {
      ARN: 'arnString',
      CreatedDate: 1537777045987,
      Name: 'nameString',
      SecretString: '{"secretId": "secretValue",}',
      VersionId: 'someVersionId',
      VersionStages: [ 'someVersionStage' ]
    }
    AWS.mock('SecretsManager', 'getSecretValue', function (params, callback) {
      callback(null, secretsResponseMock)
    })
    SecretsManager.getSecrets(secretTag, (err, eligibilitySecrets) => {
      expect(err).toBeDefined()
      expect(err).toMatchObject(new SyntaxError('Unexpected token } in JSON at position 27'))
      AWS.restore('SecretsManager', 'getSecretValue')
      done()
    })
  })
  test('should handle downstream service error: "ResourceNotFoundException"', (done) => {
    let secretTag = `develop/eligibility/eligibility`
    let secretsErrorMock = new Error('AWS error occured')
    secretsErrorMock.code = 'ResourceNotFoundException'
    AWS.mock('SecretsManager', 'getSecretValue', function (params, callback) {
      callback(secretsErrorMock)
    })
    SecretsManager.getSecrets(secretTag, (err, eligibilitySecrets) => {
      expect(err).toBeDefined()
      expect(err.code).toBe('ResourceNotFoundException')
      expect(eligibilitySecrets).not.toBeDefined()
      AWS.restore('SecretsManager', 'getSecretValue')
      done()
    })
  })
  test('should handle downstream service error: "InvalidRequestException"', (done) => {
    let secretTag = `develop/eligibility/eligibility`
    let secretsErrorMock = new Error('AWS error occured')
    secretsErrorMock.code = 'InvalidRequestException'
    AWS.mock('SecretsManager', 'getSecretValue', function (params, callback) {
      callback(secretsErrorMock)
    })
    SecretsManager.getSecrets(secretTag, (err, eligibilitySecrets) => {
      expect(err).toBeDefined()
      expect(err.code).toBe('InvalidRequestException')
      expect(eligibilitySecrets).not.toBeDefined()
      AWS.restore('SecretsManager', 'getSecretValue')
      done()
    })
  })
  test('should handle downstream service error: "InvalidParameterException"', (done) => {
    let secretTag = `develop/eligibility/eligibility`
    let secretsErrorMock = new Error('AWS error occured')
    secretsErrorMock.code = 'InvalidParameterException'
    AWS.mock('SecretsManager', 'getSecretValue', function (params, callback) {
      callback(secretsErrorMock)
    })
    SecretsManager.getSecrets(secretTag, (err, eligibilitySecrets) => {
      expect(err).toBeDefined()
      expect(err.code).toBe('InvalidParameterException')
      expect(eligibilitySecrets).not.toBeDefined()
      AWS.restore('SecretsManager', 'getSecretValue')
      done()
    })
  })
})
