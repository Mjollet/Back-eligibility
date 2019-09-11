# Eligibility Component

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/npm.svg)](https://badge.fury.io/js/npm)

This project contains a set of **Serverless** functions all listed inside `services/` :

* add-definitions : adds the list of definitions to the dictionary collection
* add-rules : adds the list of rules to the rules collection
* get-definitions: retrieves all the definitions in the dictionary collection
* get-rules: retrieves all the rules in the rule's table
* drop-definition: deletes single definition
* drop-rule: deletes single rule
* orchestrate: the main service assessing the global eligibility
* technical-eligibility: assess technical eligibility


## Contribution notes

Steps for commiting:

1. make sure you're on the right branch
2. make changes
3. stage files: e.g. `git add *`
4. `npm run gcz`
5. push to github
6. open pull request to *develop* branch

For more information about commitizen see the [docs](https://github.com/commitizen/cz-cli)

## How to run tests

To run api or unit tests for this service, you need to start local DynamoDB instance (read the section "Running DynamoDB locally") and use proper npm scripts.

1. Start DynamoDB in a shell: `java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb`
2. Start serverless in a separate shell (or tab): `npm run offline`
3. Run tests: `npm run test`

## Running DynamoDB locally

Download DynamoDb archive from official AWS website: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html

Install dynamodb locall and start it like this:

```shell
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

Run db seed to create tables and populate them with sample data: `npm run dynamodb`. You need to **do this only once** (or after changes in test data in `/db-scripts/data/`)!

You can use aws CLI for administration tasks, e.g.: `aws dynamodb list-tables --endpoint-url http://localhost:8000` or this docker image: https://hub.docker.com/r/amazon/dynamodb-local/ for an easier management of your local DynamoDB instane.
