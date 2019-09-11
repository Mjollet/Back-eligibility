const SchemaValidator = new (require('sams-js-submodules').SamsSchemaValidator)()

const SchemaValidateMW = {
  error400: (schema) => {
    var err = new Error(`Bad Request: Invalid ${schema}`)
    err.statusCode = 400
    return err
  },

  init: async (event, context, next) => {
    try {
      await SchemaValidateMW.initSchemaValidator()
    } catch (error) {
      return error
    }
    return next(event, context)
  },

  initSchemaValidator: async () => {
    if (SchemaValidateMW.validatorOpts) {
      return
    }
    SchemaValidateMW.validatorOpts = {
      local: false,
      s3: {
        region: process.env.REGION,
        bucket: process.env.S3_ELIGIBILITY_SCHEMA_BUCKET_NAME
      }
    }
    if (process.env.STAGE === 'localhost') {
      SchemaValidateMW.validatorOpts.s3.endpoint = process.env.S3_ENDPOINT
      SchemaValidateMW.validatorOpts.s3.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_KEY_ID
      }
    }
    await SchemaValidator.init(SchemaValidateMW.validatorOpts)
  },

  validateGenericEligibilitySchema: async(event, context, next) => {
    if (!event.body) {
      return SchemaValidateMW.error400('body')
    }
    let isGenericEligibility = await SchemaValidator.validate('generic-eligibility.schema.json', event.body)
    if (!isGenericEligibility) {
      return SchemaValidateMW.error400('body')
    }
    return next(event, context)
  },

  validateGlobalEligibilitySchema: async(event, context, next) => {
    if (!event.body) {
      return SchemaValidateMW.error400('body')
    }
    let isGlobalEligibility = await SchemaValidator.validate('global-eligibility.schema.json', event.body)
    if (!isGlobalEligibility) {
      return SchemaValidateMW.error400('body')
    }
    return next(event, context)
  },

  validateGlobOrGenEligibilitySchema: async(event, context, next) => {
    if (!event.body) {
      return SchemaValidateMW.error400('body')
    }
    let isGenericEligibility = await SchemaValidator.validate('generic-eligibility.schema.json', event.body)
    let isGlobalEligibility = await SchemaValidator.validate('global-eligibility.schema.json', event.body)
    if (!isGlobalEligibility && !isGenericEligibility) {
      return SchemaValidateMW.error400('body')
    }
    return next(event, context)
  }

}

module.exports = SchemaValidateMW
