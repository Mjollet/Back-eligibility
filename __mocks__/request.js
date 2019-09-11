'use-strict'
/* global jest */
const {error, response, responseBody} = require('./__utils__/requestMock')

module.exports = jest.fn((reqObj, callback) => {
  callback(error(), response(), responseBody())
})
