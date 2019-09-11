'use strict'
/* global afterEach, describe, expect, test */
const Conditions = require('../../lib/conditions')
const AWS = require('aws-sdk-mock')
const sinon = require('sinon')

describe('Conditions', () => {
  // reset DynamoDB mocks
  afterEach((done) => {
    AWS.restore('DynamoDB.DocumentClient')
    Conditions.reset()
    done()
  })
  test('Should call Dictionary once per label for multiconditions evaluation', async (done) => {
    // let spy = jest.spyOn(Dictionary, 'getSymbol')
    let dbMock = sinon
      .stub()
      .callsFake((params, callback) => {
        callback(null, {
          'Item': {
            'symbol': '$.customer.subscribedProducts.activatedSubscriptions',
            'attributes': [
              'VIN',
              'subscriptionStatus',
              'subscriptionStartDate',
              'subscriptionEndDate',
              'remainingDays',
              'idSubscription',
              'idRatePlan',
              'idProduct'
            ],
            'label': "Customer's activated subscriptions",
            'category': 'commercial',
            'type': 'objectArray'
          }
        })
      })
    AWS.mock('DynamoDB.DocumentClient', 'get', dbMock)
    let body = {
      'customer': {
        'subscribedProducts': {
          'historicalSubscriptions': [{
            'idProduct': '0'
          }],
          'activatedSubscriptions': [{
            'idProduct': '1'
          }],
          'pendingSubscriptions': [{
            'idProduct': '2'
          }]
        }
      }
    }

    let rule = {
      'ruleTag': 'ZAR_NOT_SUBSCRIBED',
      'overall': true,
      'conditions': {
        'conditions': [{
          'value': {
            'idProduct': '0'
          },
          'operator': 'excludes',
          'label': "Customer's activated subscriptions"
        },
        {
          'value': {
            'idProduct': '1'
          },
          'operator': 'excludes',
          'label': "Customer's activated subscriptions"
        },
        {
          'value': {
            'idProduct': '2'
          },
          'operator': 'excludes',
          'label': "Customer's activated subscriptions"
        },
        {
          'value': {
            'idProduct': '3'
          },
          'operator': 'excludes',
          'label': "Customer's activated subscriptions"
        },
        {
          'value': {
            'idProduct': '4'
          },
          'operator': 'excludes',
          'label': "Customer's activated subscriptions"
        },
        {
          'value': {
            'idProduct': '5'
          },
          'operator': 'excludes',
          'label': "Customer's activated subscriptions"
        }
        ],
        'operator': '&&'
      },
      'type': 'commercial',
      'status': 'public'
    }
    await Conditions.init()
    Conditions.evaluate(body, rule.conditions, rule.type, (err, result) => {
      if (err) {
        throw err
      }
      Conditions.evaluate(body, rule.conditions, rule.type, (err, result) => {
        if (err) {
          throw err
        }
        // console.log(dbMock)
        // second evaluation should use the same cache, so Dictionary is not called again
        expect(dbMock.calledOnce).toBeTruthy()
        done()
      }, [])
    }, [])
  })
})
