'use strict'
/* global jest, beforeEach, afterEach, describe, expect, test */
const AWS = require('aws-sdk-mock')
const sinon = require('sinon')
const Dictionary = require('../../lib/dictionary')
const Logger = require('sams-js-submodules').samsLoggerJs

describe('Dictionary', () => {
  // reset DynamoDB mocks
  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient')
    Dictionary.reset()
  })
  describe('.putDefinition', () => {
    let resMock
    beforeEach(async () => {
      resMock = {
        Item: 'mocked result'
      }
      AWS.mock('DynamoDB.DocumentClient', 'put', resMock)
      await Dictionary.init()
    })
    test('should add an item to the collection', async (done) => {
      // regular payload
      let item = {
        'label': 'Communication Channel (Web, Mobile)',
        'category': 'commercial',
        'symbol': '$.store.channel',
        'type': 'string'
      }
      Dictionary.putDefinition(item, (err, res) => {
        expect(err).toBe(null)
        expect(res).toMatchObject(resMock)
        done()
      })
    })
    test('should prevent adding irregular definitions', (done) => {
      // missing category attr
      let item = {
        'label': 'Communication Channel (Web, Mobile)',
        'symbol': '$.store.channel',
        'type': 'string'
      }
      Dictionary.putDefinition(item, (err, res) => {
        expect(err).toMatchObject(new Error('Invalid definition'))
        done()
      })
    })
  })
  describe('.deleteDefinition', () => {
    let resMock = {
      Item: 'mocked result'
    }
    beforeEach(async () => {
      AWS.mock('DynamoDB.DocumentClient', 'delete', resMock)
      await Dictionary.init()
    })
    test('should remove definition from the collection', (done) => {
      Dictionary.deleteDefinition('test-label', 'test-category', (err, res) => {
        expect(err).toBe(null)
        expect(res).toMatchObject(resMock)
        done()
      })
    })
    test('should return \'Bad request\' error via callback callback if label is undefined', (done) => {
      Dictionary.deleteDefinition(undefined, 'test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Bad request'))
        done()
      })
    })
    test('should return \'Bad request\' error via callback if category is undefined', (done) => {
      Dictionary.deleteDefinition('test-label', undefined, (err, res) => {
        expect(err).toMatchObject(new Error('Bad request'))
        done()
      })
    })
  })
  describe('.putDefinitions', () => {
    let resMock = {
      Item: 'mocked result'
    }
    test('should add a list of definitions to the collection', async (done) => {
      let definitions = [{
        'label': 'test-label-1',
        'category': 'test-category',
        'symbol': '$.some.path',
        'type': 'string'
      },
      {
        'label': 'test-label-2',
        'category': 'test-category',
        'symbol': '$.some.path',
        'type': 'string'
      }
      ]
      AWS.mock('DynamoDB.DocumentClient', 'batchWrite', (params, callback) => {
        callback(null, resMock)
      })
      await Dictionary.init()
      Dictionary.putDefinitions(definitions, (err, res) => {
        expect(err).toBe(null)
        expect(res).toMatchObject([resMock])
        done()
      })
    })
    test('should process UnprocessedItems', async (done) => {
      let definitions = [{
        'label': 'test-label-1',
        'category': 'test-category',
        'symbol': '$.some.path',
        'type': 'string'
      },
      {
        'label': 'test-label-2',
        'category': 'test-category',
        'symbol': '$.some.path',
        'type': 'string'
      }
      ]
      let resMock1 = {
        'UnprocessedItems': {
          'localhost-Dictionary': true
        }
      }
      let resMock2 = {
        Item: 'mocked result'
      }
      AWS.mock('DynamoDB.DocumentClient', 'batchWrite', sinon
        .stub()
        .onCall(0).callsFake((params, callback) => {
          callback(null, resMock1)
        })
        .onCall(1).callsFake((params, callback) => {
          callback(null, resMock2)
        })
      )
      await Dictionary.init()
      Dictionary.putDefinitions(definitions, (err, res) => {
        expect(err).toBe(null)
        expect(res).toMatchObject([
          resMock2
        ])
        done()
      })
    })
    test('should accept only array of definitions', async (done) => {
      // mising symbol attribute
      let definitions = {}
      AWS.mock('DynamoDB.DocumentClient', 'batchWrite', (params, callback) => {
        callback(null, resMock)
      })
      await Dictionary.init()
      Dictionary.putDefinitions(definitions, (err, res) => {
        expect(err).toMatchObject(new Error('definitions must be an array'))
        expect(err.statusCode).toBe(400)
        done()
      })
    })
    test('should queue definitions in bundles of 25 items', async (done) => {
      let resMock = {
        Item: 'mocked result'
      }
      let definitions = []
      for (var i = 0; i < 26; i++) {
        definitions.push({
          'label': `test-label-${i}`,
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        })
      }
      AWS.mock('DynamoDB.DocumentClient', 'batchWrite', (params, callback) => {
        callback(null, resMock)
      })
      await Dictionary.init()
      Dictionary.putDefinitions(definitions, (err, res) => {
        expect(err).toBe(null)
        expect(res).toMatchObject([resMock, resMock])
        done()
      })
    })
    test('should prevent adding invalid definitions and respond with \'Invalid definition at index 0\' error', async (done) => {
      // mising symbol attribute
      let definitions = [{
        'label': 'test-label-1',
        'category': 'test-category',
        'type': 'string'
      }]
      let awsSpy = sinon.spy()
      AWS.mock('DynamoDB.DocumentClient', 'batchWrite', awsSpy)
      await Dictionary.init()
      Dictionary.putDefinitions(definitions, (err, res) => {
        expect(err).toMatchObject(new Error('Invalid definition at index 0'))
        expect(err.statusCode).toBe(400)
        expect(awsSpy.notCalled).toBeTruthy()
        done()
      })
    })
    test('should forward DynamoDB error to the callback', async (done) => {
      let definitions = [{
        'label': 'test-label-1',
        'category': 'test-category',
        'symbol': '$.some.path',
        'type': 'string'
      },
      {
        'label': 'test-label-2',
        'category': 'test-category',
        'symbol': '$.some.path',
        'type': 'string'
      }
      ]
      AWS.mock('DynamoDB.DocumentClient', 'batchWrite', (params, callback) => {
        callback(new Error('Mocked Error'))
      })
      await Dictionary.init()
      Dictionary.putDefinitions(definitions, (err, res) => {
        expect(err).toMatchObject(new Error('Mocked Error'))
        done()
      })
    })
  })
  describe('.getDefinition', () => {
    test('should fetch a single definition matching the label and category', async (done) => {
      let resMock = {
        Item: {
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }
      }
      AWS.mock('DynamoDB.DocumentClient', 'get', resMock)
      await Dictionary.init()
      Dictionary.getDefinition('test-label', 'test-category', (err, res) => {
        expect(err).toBe(null)
        expect(res).toMatchObject(resMock.Item)
        done()
      })
    })
    test('should inform about non-existing definition', async (done) => {
      let resMock = {}
      AWS.mock('DynamoDB.DocumentClient', 'get', resMock)
      let loggerSpy = Logger.warn = jest.fn()
      await Dictionary.init()
      Dictionary.getDefinition('test-label', 'test-category', (err, res) => {
        expect(err).toBe(null)
        expect(res).toBeUndefined()
        expect(loggerSpy).toHaveBeenCalled()
        done()
      })
    })
    test('should forward DynamoDB error to callback', async (done) => {
      AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
        callback(new Error('Mocked Error'))
      })
      await Dictionary.init()
      Dictionary.getDefinition('test-label', 'test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Mocked Error'))
        done()
      })
    })
  })
  describe('.getSymbol', () => {
    test('should return definitions symbol to the callback', async (done) => {
      let resMock = {
        Item: {
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }
      }
      AWS.mock('DynamoDB.DocumentClient', 'get', resMock)
      await Dictionary.init()
      Dictionary.getSymbol('test-label', 'test-category', (err, res) => {
        expect(err).toBeNull()
        expect(res).toBe('$.some.path')
        done()
      })
    })
    test('should return \'Label not found\' error to the callback if definition does not exist', async (done) => {
      let resMock = {}
      AWS.mock('DynamoDB.DocumentClient', 'get', resMock)
      await Dictionary.init()
      Dictionary.getSymbol('test-label', 'test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Label not found : test-label'))
        done()
      })
    })
    test('should forward DynamoDB error to the callback', async (done) => {
      AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
        callback(new Error('Mocked Error'))
      })
      await Dictionary.init()
      Dictionary.getSymbol('test-label', 'test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Mocked Error'))
        done()
      })
    })
  })
  describe('.getType', () => {
    test('should return definitions type to the callback', async (done) => {
      let resMock = {
        Item: {
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }
      }
      AWS.mock('DynamoDB.DocumentClient', 'get', resMock)
      await Dictionary.init()
      Dictionary.getType('test-label', 'test-category', (err, res) => {
        expect(err).toBeNull()
        expect(res).toBe('string')
        done()
      })
    })
    test('should return \'Label not found\' error to the callback if definition does not exist', async (done) => {
      let resMock = {}
      AWS.mock('DynamoDB.DocumentClient', 'get', resMock)
      await Dictionary.init()
      Dictionary.getType('test-label', 'test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Label not found : test-label'))
        done()
      })
    })
    test('should forward DynamoDB error to the callback', async (done) => {
      AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
        callback(new Error('Mocked Error'))
      })
      await Dictionary.init()
      Dictionary.getType('test-label', 'test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Mocked Error'))
        done()
      })
    })
  })
  describe('.getAllByCategory', () => {
    test('should scan DynamoDB and return a list of definitions to the callback', async (done) => {
      let resMock = {
        Items: [{
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        },
        {
          'label': 'test-label-2',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }
        ]
      }
      AWS.mock('DynamoDB.DocumentClient', 'scan', resMock)
      await Dictionary.init()
      Dictionary.getAllByCategory('test-category', (err, res) => {
        expect(err).toBeNull()
        expect(res.length).toBe(2)
        expect(res).toMatchObject(resMock.Items)
        done()
      })
    })
    test('should make recursive call to scan if not all items have been returned', async (done) => {
      let resMock1 = {
        LastEvaluatedKey: 'test-label-1',
        Items: [{
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }]
      }
      let resMock2 = {
        Items: [{
          'label': 'test-label-2',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }]
      }
      AWS.mock('DynamoDB.DocumentClient', 'scan', sinon
        .stub()
        .onCall(0).callsFake((params, callback) => {
          callback(null, resMock1)
        })
        .onCall(1).callsFake((params, callback) => {
          callback(null, resMock2)
        })
      )
      await Dictionary.init()
      Dictionary.getAllByCategory('test-category', (err, res) => {
        expect(err).toBeNull()
        expect(res).toMatchObject([{
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        },
        {
          'label': 'test-label-2',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }
        ])
        done()
      })
    })
    test('should forward DynamoDB error to the callback', async (done) => {
      AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
        callback(new Error('Mocked Error'))
      })
      await Dictionary.init()
      Dictionary.getAllByCategory('test-category', (err, res) => {
        expect(err).toMatchObject(new Error('Mocked Error'))
        done()
      })
    })
  })
  describe('.getAll', () => {
    test('should return all definitions from the collection to the callback', async (done) => {
      let resMock = {
        Items: [{
          'label': 'test-label-1',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        },
        {
          'label': 'test-label-2',
          'category': 'test-category',
          'symbol': '$.some.path',
          'type': 'string'
        }
        ]
      }
      AWS.mock('DynamoDB.DocumentClient', 'scan', resMock)
      await Dictionary.init()
      Dictionary.getAll((err, res) => {
        expect(err).toBeNull()
        expect(res.length).toBe(2)
        expect(res).toMatchObject(resMock.Items)
        done()
      })
    })
  })
})
