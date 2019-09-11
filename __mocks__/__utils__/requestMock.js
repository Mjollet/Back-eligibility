'use-strict'
/* global jest */
const requestMock = {
  error: jest.fn().mockReturnValue(null),
  response: jest.fn()
    .mockReturnValue({
      statusCode: 200
    }),
  responseBody: jest.fn()
    .mockReturnValue(JSON.stringify({
      mocked: true
    })),
  reset: () => {
    requestMock.error.mockReset()
    requestMock.error.mockReturnValue(null)
    requestMock.response.mockReset()
    requestMock.response.mockReturnValue({
      statusCode: 200
    })
    requestMock.responseBody.mockReset()
    requestMock.responseBody.mockReturnValue(JSON.stringify({
      mocked: true
    }))
  }
}
module.exports = {
  error: requestMock.error,
  response: requestMock.response,
  responseBody: requestMock.responseBody,
  reset: requestMock.reset
}
