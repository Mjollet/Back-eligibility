'use-strict'
/* global jest, afterEach, describe, test, expect */

const Operators = require('../../lib/operators')

describe('Operators', () => {
  describe('includeOrExclude', () => {
    let value = 'test-value'
    let cb1 = jest.fn()
    let cb2 = jest.fn()
    afterEach(() => {
      jest.resetAllMocks()
    })
    test('should support with labels of type "array"', () => {
      let labelDef = {
        type: 'array'
      }
      Operators.includeOrExclude(labelDef, value, cb1, cb2)
      expect(cb1).toBeCalled()
      expect(cb1).toBeCalledWith(labelDef, value)
      expect(cb2).not.toBeCalled()
    })
    test('should support labels of type "objectArray"', () => {
      let labelDef = {
        type: 'objectArray'
      }
      Operators.includeOrExclude(labelDef, value, cb1, cb2)
      expect(cb1).not.toBeCalled()
      expect(cb2).toBeCalled()
      expect(cb2).toBeCalledWith(labelDef, value)
    })
    test('should throw an exception if label has a not supported type', () => {
      let labelDef = {
        type: 'smth'
      }
      try {
        Operators.includeOrExclude(labelDef, value, cb1, cb2)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('Cannot perform inclusion or exclusion operation on another type than "array" or "objectArray"'))
      }
    })
  })
  describe('contains', () => {
    test('should check for empty input', () => {
      let labelDef = {
        type: 'smth'
      }
      let input = []
      try {
        Operators.contains(labelDef, input)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('Cannot perform "contains" operation using empty array as input'))
      }
    })
    test('should support labels of type string', () => {
      let labelDef = {
        type: 'string',
        symbol: '$.store.channel'
      }
      let input = ['channel1', 'channel2']
      let result = Operators.contains(labelDef, input)
      expect(result).toBe('(["channel1","channel2"].includes($.store.channel))')
    })
    test('should support labels of type array', () => {
      let labelDef = {
        type: 'array',
        symbol: '$.custom.list'
      }
      let input = ['item1', 'item2']
      let result = Operators.contains(labelDef, input)
      expect(result).toBe('(["item1","item2"].filter(item => $.custom.list.includes(item)).length === ["item1","item2"].length)')
    })
    test('should throw an error for labels of object', () => {
      let labelDef = {
        type: 'object',
        symbol: '$.customer'
      }
      let input = ['item1', 'item2']
      try {
        Operators.contains(labelDef, input)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('operator "contains" is not supported on objects or objectArrays'))
      }
    })
    test('should throw an error for labels of objectArray', () => {
      let labelDef = {
        type: 'objectArray',
        symbol: '$.customer.subscribedProducts.pendingSubscriptions'
      }
      let input = ['item1', 'item2']
      try {
        Operators.contains(labelDef, input)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('operator "contains" is not supported on objects or objectArrays'))
      }
    })
  })
  describe('notContains', () => {
    test('should check for empty input', () => {
      let labelDef = {
        type: 'smth'
      }
      let input = []
      try {
        Operators.contains(labelDef, input)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('Cannot perform "not contains" operation using empty array as input'))
      }
    })
    test('should support labels of type string', () => {
      let labelDef = {
        type: 'string',
        symbol: '$.store.channel'
      }
      let input = ['channel1', 'channel2']
      let result = Operators.notContains(labelDef, input)
      expect(result).toBe('(!["channel1","channel2"].includes($.store.channel))')
    })
    test('should support labels of type array', () => {
      let labelDef = {
        type: 'array',
        symbol: '$.custom.list'
      }
      let input = ['item1', 'item2']
      let result = Operators.notContains(labelDef, input)
      expect(result).toBe('(["item1","item2"].filter(item => $.custom.list.includes(item)).length === 0)')
    })
    test('should throw an error for labels of object', () => {
      let labelDef = {
        type: 'object',
        symbol: '$.customer'
      }
      let input = ['item1', 'item2']
      try {
        Operators.notContains(labelDef, input)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('operator "not contains" is not supported on objects or objectArrays'))
      }
    })
    test('should throw an error for labels of objectArray', () => {
      let labelDef = {
        type: 'objectArray',
        symbol: '$.customer.subscribedProducts.pendingSubscriptions'
      }
      let input = ['item1', 'item2']
      try {
        Operators.notContains(labelDef, input)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('operator "not contains" is not supported on objects or objectArrays'))
      }
    })
  })
  describe('simpleInclusion', () => {
    test('should construct a condition for value existance in the array', () => {
      let labelDef = {
        symbol: '$.custom.array'
      }
      let value = '"item1"'
      let result = Operators.simpleInclusion(labelDef, value)
      expect(result).toBe('($.custom.array.indexOf("item1") > -1)')
    })
  })
  describe('nestedInclusion', () => {
    test('should construct a condition for object inclusion', () => {
      let labelDef = {
        symbol: '$.customer.subscribedProducts.activeSubscriptions'
      }
      let value = {
        'key1': 'val1',
        'key2': 'val2'
      }
      let expected = `($.customer.subscribedProducts.activeSubscriptions.filter(function(obj) {
      let log = []
      Object.keys({"key1":"val1","key2":"val2"}).forEach(function (key) {
        if (obj[key] === {"key1":"val1","key2":"val2"}[key]) {
          log.push(true)
        } else {
          log.push(false)
        }
      })
      if (log.includes(false)) {
        return false
      } else {
        return true
      }
    }).length > 0)`
      let result = Operators.nestedInclusion(labelDef, value)
      expect(result).toBe(expected)
    })
    test('should not allow values other than objects', () => {
      let labelDef = {
        symbol: '$.custom.array'
      }
      let value = '"not an object"'
      try {
        Operators.nestedInclusion(labelDef, value)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('Value is not an object'))
      }
    })
  })
  describe('simpleExclusion', () => {
    test('should construct a condition for value existance in the array', () => {
      let labelDef = {
        symbol: '$.custom.array'
      }
      let value = '"item1"'
      let result = Operators.simpleExclusion(labelDef, value)
      expect(result).toBe('($.custom.array.indexOf("item1") === -1)')
    })
  })
  describe('nestedExclusion', () => {
    test('should construct a condition for object exclusion', () => {
      let labelDef = {
        symbol: '$.customer.subscribedProducts.activeSubscriptions'
      }
      let value = {
        'key1': 'val1',
        'key2': 'val2'
      }
      let expected = `($.customer.subscribedProducts.activeSubscriptions.filter(function(obj) {
      let log = []
      Object.keys({"key1":"val1","key2":"val2"}).forEach(function (key) {
        if (obj[key] === {"key1":"val1","key2":"val2"}[key]) {
          log.push(true)
        } else {
          log.push(false)
        }
      })
      if (log.includes(false)) {
        return false
      } else {
        return true
      }
    }).length === 0)`
      let result = Operators.nestedExclusion(labelDef, value)
      expect(result).toBe(expected)
    })
    test('should not allow values other than objects', () => {
      let labelDef = {
        symbol: '$.custom.array'
      }
      let value = '"not an object"'
      try {
        Operators.nestedExclusion(labelDef, value)
      } catch (err) {
        expect(err).toMatchObject(new TypeError('Value is not an object'))
      }
    })
  })
})
