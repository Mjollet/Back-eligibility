# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.20.3"></a>
## [1.20.3](https://github.com/gekkoteam/sams_eligibility/compare/v1.20.2...v1.20.3) (2019-07-12)


### Features

* **Sams Schema Validator integration:** fixes issue where  sams schema validator is a singleton ([67393fc](https://github.com/gekkoteam/sams_eligibility/commit/67393fc))



<a name="1.20.2"></a>
## [1.20.2](https://github.com/gekkoteam/sams_eligibility/compare/v1.20.1...v1.20.2) (2019-07-12)


### Bug Fixes

* **Serverless Dyanmodb resource:** fixes issue where tables were created with stage as a prefix to t ([2092b85](https://github.com/gekkoteam/sams_eligibility/commit/2092b85))



<a name="1.20.1"></a>
## [1.20.1](https://github.com/gekkoteam/sams_eligibility/compare/v1.20.0...v1.20.1) (2019-07-12)


### Bug Fixes

* **Serverless Environment variable value:** fixes issue where S3_ELIGIBILITY_SCHEMA_BUCKET_NAME was ([6468641](https://github.com/gekkoteam/sams_eligibility/commit/6468641))



<a name="1.20.0"></a>
# [1.20.0](https://github.com/gekkoteam/sams_eligibility/compare/v1.19.1...v1.20.0) (2019-07-12)


### Bug Fixes

* **muse.js:** Fix Muse secrets loading ([9e10129](https://github.com/gekkoteam/sams_eligibility/commit/9e10129))
* **XRay Middleware:** disables xray capturing ([5638a6c](https://github.com/gekkoteam/sams_eligibility/commit/5638a6c))


### Features

* **all services:** integrates xray as MW in all services ([c7c4392](https://github.com/gekkoteam/sams_eligibility/commit/c7c4392)), closes [#70](https://github.com/gekkoteam/sams_eligibility/issues/70)
* **Core Libraries:** enhances init to use s3 to init schema validator ([b4ed33c](https://github.com/gekkoteam/sams_eligibility/commit/b4ed33c))
* **middleware:** add xray as middleware ([1c18076](https://github.com/gekkoteam/sams_eligibility/commit/1c18076)), closes [#70](https://github.com/gekkoteam/sams_eligibility/issues/70)
* **outgoing response middleware:** handles error to AWS Xray ([98e5990](https://github.com/gekkoteam/sams_eligibility/commit/98e5990)), closes [#70](https://github.com/gekkoteam/sams_eligibility/issues/70)



<a name="1.19.1"></a>
## [1.19.1](https://github.com/gekkoteam/sams_eligibility/compare/v1.19.0...v1.19.1) (2019-05-23)



<a name="1.19.0"></a>
# [1.19.0](https://github.com/gekkoteam/sams_eligibility/compare/v1.17.0...v1.19.0) (2019-05-21)


### Features

* **serverless:** Enable 2way SSL security pattern ([f80e652](https://github.com/gekkoteam/sams_eligibility/commit/f80e652))
* **serverless.yml:** Add serverless-plugin-optiomize ([76a544d](https://github.com/gekkoteam/sams_eligibility/commit/76a544d)), closes [#60](https://github.com/gekkoteam/sams_eligibility/issues/60)
* **services:** Use the latest version (v1.0.0) sams-js-submodules ([44c264c](https://github.com/gekkoteam/sams_eligibility/commit/44c264c)), closes [#55](https://github.com/gekkoteam/sams_eligibility/issues/55)



<a name="1.17.0"></a>
# [1.17.0](https://github.com/gekkoteam/sams_eligibility/compare/v1.0.18...v1.17.0) (2019-04-15)


### Bug Fixes

* **cache.js:** Make sure that rules and definitions cache is reset on init ([192cf7b](https://github.com/gekkoteam/sams_eligibility/commit/192cf7b))
* **VIN SCHEMA:** changes vin schema to a mure flexible ---> only 17 characters restriction. ([2306095](https://github.com/gekkoteam/sams_eligibility/commit/2306095))



<a name="0.12.1"></a>
## [0.12.1](https://github.com/gekkoteam/sams_eligibility/compare/v0.12.0...v0.12.1) (2019-02-14)


### Features

* **serverless:** Use serverless-dotenv-plugin for managing local secrets ([1c636e4](https://github.com/gekkoteam/sams_eligibility/commit/1c636e4)), closes [#36](https://github.com/gekkoteam/sams_eligibility/issues/36)
* **Serverless configuration:** Integrates API KEY security ([8929282](https://github.com/gekkoteam/sams_eligibility/commit/8929282)), closes [#38](https://github.com/gekkoteam/sams_eligibility/issues/38)


### BREAKING CHANGES

* **serverless:** npm install need to be run



<a name="0.12.0"></a>
# [0.12.0](https://github.com/gekkoteam/sams_eligibility/compare/v0.11.4...v0.12.0) (2019-01-30)


### Bug Fixes

* **eligibility:** fixes issue while looping through result description (to remove stack) ([72d3c4f](https://github.com/gekkoteam/sams_eligibility/commit/72d3c4f))
* **eligibility:** fixes issues where context is missing for evaluation ([741aead](https://github.com/gekkoteam/sams_eligibility/commit/741aead))
* **eligibility lambda:** fixes call to function assessSingleRuleTag, missing parameter type ([078cfce](https://github.com/gekkoteam/sams_eligibility/commit/078cfce))
* **eligibility lambda:** fixes conflict ([dd3bd6d](https://github.com/gekkoteam/sams_eligibility/commit/dd3bd6d))
* **eligibility lambda:** fixes issue with result formatting ([5f455e5](https://github.com/gekkoteam/sams_eligibility/commit/5f455e5))
* **eligibility service:** fixes issue while receiving empty subject (offers or product) ([7809786](https://github.com/gekkoteam/sams_eligibility/commit/7809786))
* **json schemas:** corrects generic-eligibility.schema.json, replacing product and offer by products ([7842d56](https://github.com/gekkoteam/sams_eligibility/commit/7842d56))
* **log:** addes more logs ([4b46607](https://github.com/gekkoteam/sams_eligibility/commit/4b46607))
* **muse handler:** fixes typo on function name ([bc7d7a2](https://github.com/gekkoteam/sams_eligibility/commit/bc7d7a2))
* **muse.js:** Fix client error handling ([32371c9](https://github.com/gekkoteam/sams_eligibility/commit/32371c9))
* **orchestrator:** correcting bug while merging results from tech and comm eligibilities ([a79f6e1](https://github.com/gekkoteam/sams_eligibility/commit/a79f6e1))
* **orchestrator:** Unify global eligibility assessment merging for tech eligiblity results ([be820e6](https://github.com/gekkoteam/sams_eligibility/commit/be820e6)), closes [#8](https://github.com/gekkoteam/sams_eligibility/issues/8)
* **package.json:** fixes dependency issue ([ae544bb](https://github.com/gekkoteam/sams_eligibility/commit/ae544bb))
* **required modules:** fixes required modules (xml, remove usage of path..) ([00bc8a4](https://github.com/gekkoteam/sams_eligibility/commit/00bc8a4))
* **response:** fixes issue where missing headers throws exception (init) ([50e4a09](https://github.com/gekkoteam/sams_eligibility/commit/50e4a09))
* **response lib:** fixes stringifying object multiple times issue ([81d471e](https://github.com/gekkoteam/sams_eligibility/commit/81d471e))
* **technical eligibility lambda:** fixes typo on result object ([e277f03](https://github.com/gekkoteam/sams_eligibility/commit/e277f03))
* **warm-up:** adds vpc configuration to warm-up configuration ([1d14cc7](https://github.com/gekkoteam/sams_eligibility/commit/1d14cc7)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **warm-up:** fixes warm-up configuration by adding plugin in serverless ([6ab2fe5](https://github.com/gekkoteam/sams_eligibility/commit/6ab2fe5)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **warm-up:** fixes warm-up configuration by adding variable WARM_UP_MODULE ([49ca5a5](https://github.com/gekkoteam/sams_eligibility/commit/49ca5a5)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **warm-up:** gaves a unique name to warm-up configuration ([875b39c](https://github.com/gekkoteam/sams_eligibility/commit/875b39c)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **warm-up configuration:** adds vpc info to warm-up config ([87bb368](https://github.com/gekkoteam/sams_eligibility/commit/87bb368)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **warm-up configuration:** configures default warm-up for all functions ([9dddffb](https://github.com/gekkoteam/sams_eligibility/commit/9dddffb)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)


### Features

* **caching:** refactored caching mechanism ([9002cf3](https://github.com/gekkoteam/sams_eligibility/commit/9002cf3)), closes [#31](https://github.com/gekkoteam/sams_eligibility/issues/31)
* **eligibility:** Added decoding on eligibility requests ([9c4dde6](https://github.com/gekkoteam/sams_eligibility/commit/9c4dde6))
* **eligibility lambda:** adds the capability to handle list of products or offers ([7b07689](https://github.com/gekkoteam/sams_eligibility/commit/7b07689))
* **orchestrator lib:** sends only one request to handle multiple items (products/offers) for commer ([0f1634f](https://github.com/gekkoteam/sams_eligibility/commit/0f1634f))
* **response lib:** dynamizes compression, adds init phase to the response lib, refactors code ([a9b6d58](https://github.com/gekkoteam/sams_eligibility/commit/a9b6d58)), closes [#29](https://github.com/gekkoteam/sams_eligibility/issues/29)
* **sams-logger-js:** Use sams-logger-js as submodule ([a66ac07](https://github.com/gekkoteam/sams_eligibility/commit/a66ac07)), closes [#25](https://github.com/gekkoteam/sams_eligibility/issues/25)
* **services:** Add info logging for Dynamodb calls ([21f9d34](https://github.com/gekkoteam/sams_eligibility/commit/21f9d34)), closes [#25](https://github.com/gekkoteam/sams_eligibility/issues/25)
* **services:** Add missing info/debug logs ([5cf2625](https://github.com/gekkoteam/sams_eligibility/commit/5cf2625)), closes [#25](https://github.com/gekkoteam/sams_eligibility/issues/25)
* **services:** adds response init to all services ([495f583](https://github.com/gekkoteam/sams_eligibility/commit/495f583))
* **warm-up:** enables warm-up configuration ([5d549d3](https://github.com/gekkoteam/sams_eligibility/commit/5d549d3)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)


### Performance Improvements

* **caching:** Cache only overall evaluation result for a single rule ([d7ed195](https://github.com/gekkoteam/sams_eligibility/commit/d7ed195)), closes [#31](https://github.com/gekkoteam/sams_eligibility/issues/31)
* **eligibility (atomic):** caches result of rule evaluations ([c2fef39](https://github.com/gekkoteam/sams_eligibility/commit/c2fef39))
* **gzip:** enables gzip in all requests ([f2f3277](https://github.com/gekkoteam/sams_eligibility/commit/f2f3277)), closes [#29](https://github.com/gekkoteam/sams_eligibility/issues/29)
* **Lambda warm-up:** adds warm-up configuration ([1def049](https://github.com/gekkoteam/sams_eligibility/commit/1def049)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **orchestrator.js:** Use eligibility tools to evaluate rules directly ([78d9d2c](https://github.com/gekkoteam/sams_eligibility/commit/78d9d2c)), closes [#31](https://github.com/gekkoteam/sams_eligibility/issues/31)
* **response:** enables gzip ([c2d42c3](https://github.com/gekkoteam/sams_eligibility/commit/c2d42c3))
* **response:** removes compression ([4b8cc38](https://github.com/gekkoteam/sams_eligibility/commit/4b8cc38))
* **services:** adds quick warm-up response to services ([1f8e3c4](https://github.com/gekkoteam/sams_eligibility/commit/1f8e3c4)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)
* **warm-up configuration:** removes warm-up configuration from serverless ([81bc445](https://github.com/gekkoteam/sams_eligibility/commit/81bc445)), closes [#28](https://github.com/gekkoteam/sams_eligibility/issues/28)



<a name="0.11.4"></a>
## [0.11.4](https://github.com/gekkoteam/sams_eligibility/compare/v0.11.3...v0.11.4) (2018-12-16)


### Bug Fixes

* **technical-eligibility:** Improved logging and unsupported PSA SF handling ([8a5d4b9](https://github.com/gekkoteam/sams_eligibility/commit/8a5d4b9)), closes [#5](https://github.com/gekkoteam/sams_eligibility/issues/5)


### Performance Improvements

* **rules:** Reduced number of dictionary calls for label resolution ([867ecb7](https://github.com/gekkoteam/sams_eligibility/commit/867ecb7)), closes [#19](https://github.com/gekkoteam/sams_eligibility/issues/19)
* **technical-eligibility:** Improved technical eligibility assessment ([f7ee236](https://github.com/gekkoteam/sams_eligibility/commit/f7ee236)), closes [#5](https://github.com/gekkoteam/sams_eligibility/issues/5)



<a name="0.11.3"></a>
## [0.11.3](https://github.com/gekkoteam/sams_eligibility/compare/v0.11.2...v0.11.3) (2018-12-10)


### Bug Fixes

* **Secrets Manager:** Get all muse infos from Secrets Manager ([bab1989](https://github.com/gekkoteam/sams_eligibility/commit/bab1989))



<a name="0.11.2"></a>
## [0.11.2](https://github.com/gekkoteam/sams_eligibility/compare/v0.11.1...v0.11.2) (2018-12-06)


### Bug Fixes

* **rules:** Handle rule evaluation errors ([cbf160f](https://github.com/gekkoteam/sams_eligibility/commit/cbf160f)), closes [#11](https://github.com/gekkoteam/sams_eligibility/issues/11)
* **technical-eligibility:** Fixed respoonse structure in case of unsupported psa feature code ([49ce169](https://github.com/gekkoteam/sams_eligibility/commit/49ce169))
* **technical-eligibility:** Handle 404 response from MUSE ([e219f26](https://github.com/gekkoteam/sams_eligibility/commit/e219f26)), closes [#13](https://github.com/gekkoteam/sams_eligibility/issues/13)


### Features

* **eligibility:** rule evaluation enhancement ([25d1fd9](https://github.com/gekkoteam/sams_eligibility/commit/25d1fd9)), closes [#18](https://github.com/gekkoteam/sams_eligibility/issues/18)



<a name="0.11.1"></a>
## [0.11.1](https://github.com/gekkoteam/sams_eligibility/compare/v0.11.0...v0.11.1) (2018-11-30)


### Bug Fixes

* **schemas:** adding pendingSubscriptions to schema ([a241830](https://github.com/gekkoteam/sams_eligibility/commit/a241830))



<a name="0.11.0"></a>
# [0.11.0](https://github.com/gekkoteam/sams_eligibility/compare/v0.10.1...v0.11.0) (2018-11-27)


### Bug Fixes

* **context schema:** fixes origin enum values -> DS, AP, AC ([f056dbf](https://github.com/gekkoteam/sams_eligibility/commit/f056dbf))
* **JSON schema:** fix schema for subscribed products ([cdd2c28](https://github.com/gekkoteam/sams_eligibility/commit/cdd2c28))
* **JSON schema:** fix schema for subscribed products ([1851e0f](https://github.com/gekkoteam/sams_eligibility/commit/1851e0f))
* **Rules:** Fixed includes/excludes rule evaluation ([b5a942f](https://github.com/gekkoteam/sams_eligibility/commit/b5a942f))
* **sams-logger:** Unified logs structure ([67a72c8](https://github.com/gekkoteam/sams_eligibility/commit/67a72c8))
* **Subscribed Products:** Change type from array to object on subscribed Products ([90cf666](https://github.com/gekkoteam/sams_eligibility/commit/90cf666))


### Features

* **eligibility:** Implemented support for multiple rule tags ([9dfa604](https://github.com/gekkoteam/sams_eligibility/commit/9dfa604))
* **logger:** Logger with levels to log structured messages ([b40a3cd](https://github.com/gekkoteam/sams_eligibility/commit/b40a3cd))
* **Rules:** Added support for contains, not_contains operators ([dbd866a](https://github.com/gekkoteam/sams_eligibility/commit/dbd866a))
* **sams-logger:** Unified log structure ([a9a2646](https://github.com/gekkoteam/sams_eligibility/commit/a9a2646))



<a name="0.10.1"></a>
## [0.10.1](https://github.com/gekkoteam/sams_eligibility/compare/v0.10.0...v0.10.1) (2018-11-23)


### Bug Fixes

* **release:** remove public_api param ([6b1da94](https://github.com/gekkoteam/sams_eligibility/commit/6b1da94))



<a name="0.10.0"></a>
# [0.10.0](https://github.com/gekkoteam/sams_eligibility/compare/v1.0.0...v0.10.0) (2018-11-12)


### Bug Fixes

* **Config:** Fix Secrets Manager endpoint ([335093e](https://github.com/gekkoteam/sams_eligibility/commit/335093e))
* **DynamoDB:** quickfix for TableName - pt 1/2 ([1af2ef3](https://github.com/gekkoteam/sams_eligibility/commit/1af2ef3))
* **DynamoDB:** Re-adds Rules table definition ([2fc709e](https://github.com/gekkoteam/sams_eligibility/commit/2fc709e))
* **DynamoDB:** Removes Rules table description ([ca91302](https://github.com/gekkoteam/sams_eligibility/commit/ca91302))
* **DynamoDB): fix(DynamoDB:** quickfix for TableName - pt 2/2 ([16d7710](https://github.com/gekkoteam/sams_eligibility/commit/16d7710))
* **Inclusion/Exclusion:** Fix inclusion and exclusion for eligibility rules ([495493c](https://github.com/gekkoteam/sams_eligibility/commit/495493c))
* **Local DynamoDB:** Fix TableName for local DynamoDB and unit tests ([edad642](https://github.com/gekkoteam/sams_eligibility/commit/edad642))
* **OffersEligibility:** Fixing offers schemas and source code for offers eligibility ([f34d268](https://github.com/gekkoteam/sams_eligibility/commit/f34d268))
* **serverless:** fixes bug while using env variable ([0b39382](https://github.com/gekkoteam/sams_eligibility/commit/0b39382))
* **Serverless:** Remove Rules table definition from Serverless config file ([4c69d5b](https://github.com/gekkoteam/sams_eligibility/commit/4c69d5b))
* **TechnicalEligibility:** Fix broken callback chain, remove ruleTag requirement in the payload, add ([9c523a9](https://github.com/gekkoteam/sams_eligibility/commit/9c523a9))
* **Tests:** Fix a typo in a test ([be9582d](https://github.com/gekkoteam/sams_eligibility/commit/be9582d))


### Features

* **config:** Switch to node v8.10.0 and npm v5.6.0 ([376297c](https://github.com/gekkoteam/sams_eligibility/commit/376297c))
* **dynamodb:** Added configuration for local dynamodb and seed scripts ([f06408d](https://github.com/gekkoteam/sams_eligibility/commit/f06408d))
* **lib:** Add offer schema to schema validator and swagger ([6b347dd](https://github.com/gekkoteam/sams_eligibility/commit/6b347dd))
* **muse:** Change logic so that the old payload could be used by the new endpoint ([bab2c8e](https://github.com/gekkoteam/sams_eligibility/commit/bab2c8e))
* Add new endpoint for technical eligibility and some useful variables ([a66ae78](https://github.com/gekkoteam/sams_eligibility/commit/a66ae78))
* **schemas:** Add ruleTag prop to swagger definitions and related schemas ([a7927e7](https://github.com/gekkoteam/sams_eligibility/commit/a7927e7))
* **schemas:** Add ruleTag prop to swagger definitions and related schemas ([62a828f](https://github.com/gekkoteam/sams_eligibility/commit/62a828f))
* **validation:** Require "attributes" to be presented if dictionary item is of type objectArray or ([e0144de](https://github.com/gekkoteam/sams_eligibility/commit/e0144de))
* Create new Lambda function to assess technical eligibility with MUSE ([a52fd11](https://github.com/gekkoteam/sams_eligibility/commit/a52fd11))
* Create schema for MUSE service calls ([06be184](https://github.com/gekkoteam/sams_eligibility/commit/06be184))
* Modify existing logic to make the call for MUSE possible from the old endpoint ([76cbdf8](https://github.com/gekkoteam/sams_eligibility/commit/76cbdf8))


### BREAKING CHANGES

* **Inclusion/Exclusion:** Return values now
