'use strict'
const path = require('path')
// Base templates
const eventTemplate = require(path.join(__dirname, '/templates/event.json'))
// Global eligibility
const commercialOffersPayload = require(path.join(__dirname, '/templates/global/commercial-offers-payload.json'))
const globalBundlesPayload = require(path.join(__dirname, '/templates/global/global-bundles-payload.json'))
const globalProductsPayload = require(path.join(__dirname, '/templates/global/global-products-payload.json'))
const globalFunctionalitiesPayload = require(path.join(__dirname, '/templates/global/global-functionalities-payload.json'))
// Atomic eligibility
// commercial
const comEligPayload = require(path.join(__dirname, '/templates/commercial-eligibility-payload.json'))
// technical
const techEligibilityPayload = require(path.join(__dirname, '/templates/technical/technical-eligibility-payload.json'))
const assessFunctionalitiesSetAPayload = require(path.join(__dirname, 'templates/technical/assess-functionalities-set-a-payload.json'))
const assessFunctionalitiesSetBPayload = require(path.join(__dirname, 'templates/technical/assess-functionalities-set-b-payload.json'))
// offer
const offerPayload = require(path.join(__dirname, '/templates/offer-payload.json'))
const offerNoRuleTagPayload = require(path.join(__dirname, '/templates/offer-no-ruletag-payload.json'))
// Rules management
const comRulePayload = require(path.join(__dirname, '/templates/commercial-rule-payload.json'))
// Dictionary management
const definitionPayload = require(path.join(__dirname, '/templates/definition-payload.json'))
// Error cases
const irregularPayloads = require(path.join(__dirname, '/templates/error/irregular-payloads.json'))

const Simulator = {
  /*
  opts is an object. the following properties are supported :
    * headers : object describing custom headers
    * resource: the resource path e.g: /eligiblity/{type}
    * path: the resource path
    * method: request method
    * body: request body content
    * queryStringParameters : object query parameters
    * pathParameters : object path parameters
  */
  createEvent: (opts) => {
    // cloning template
    var customEvent = JSON.parse(JSON.stringify(eventTemplate))
    for (var i in opts) {
      switch (i) {
        case 'headers':
          for (var j in opts.headers) {
            customEvent.headers[j] = opts.headers[j]
          }
          break
        case 'resource':
          customEvent.resource = opts.resource
          customEvent.requestContext.resourcePath = opts.resource
          break
        case 'path':
          customEvent.path = opts.path
          break
        case 'method':
          customEvent.httpMethod = opts.method
          customEvent.requestContext.httpMethod = opts.method
          break
        case 'body':
          customEvent.body = opts.body
          break
        case 'queryStringParameters':
          customEvent.queryStringParameters = opts.queryStringParameters
          break
        case 'pathParameters':
          customEvent.pathParameters = opts.pathParameters
          break
        default:
          continue
      }
    }
    return customEvent
  },

  // Global
  createGlobalBundlesPayload: () => {
    return JSON.parse(JSON.stringify(globalBundlesPayload))
  },

  createGlobalProductsPayload: () => {
    return JSON.parse(JSON.stringify(globalProductsPayload))
  },

  createGlobalFunctionalitiesPayload: () => {
    return JSON.parse(JSON.stringify(globalFunctionalitiesPayload))
  },

  createComEligPayload: () => {
    return JSON.parse(JSON.stringify(comEligPayload))
  },

  createDefinitionPayload: () => {
    return JSON.parse(JSON.stringify(definitionPayload))
  },

  createComRulePayload: () => {
    return JSON.parse(JSON.stringify(comRulePayload))
  },

  createOffersPayload: () => {
    return JSON.parse(JSON.stringify(commercialOffersPayload))
  },

  createOfferPayload: () => {
    return JSON.parse(JSON.stringify(offerPayload))
  },

  createOfferNoRuleTagPayload: () => {
    return JSON.parse(JSON.stringify(offerNoRuleTagPayload))
  },

  createTechEligibilityPayload: () => {
    return JSON.parse(JSON.stringify(techEligibilityPayload))
  },

  createTechFunctionalitiesSetAPayload: () => {
    return JSON.parse(JSON.stringify(assessFunctionalitiesSetAPayload))
  },

  createTechFunctionalitiesSetBPayload: () => {
    return JSON.parse(JSON.stringify(assessFunctionalitiesSetBPayload))
  },

  createIrregularPayload: (type, level, kind) => {
    return JSON.parse(JSON.stringify(irregularPayloads))[type][level][kind]
  }
}

module.exports = Simulator
