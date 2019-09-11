'use-strict'
const AWS = require('aws-sdk')

var secretsManager = {
  // retrieves secrets from remote
  getSecrets: (secretTag, callback) => {
    let SecretsManagerClient = new AWS.SecretsManager({
      endpoint: process.env.SECRET_MANAGER_ENDPOINT,
      region: process.env.REGION
    })
    SecretsManagerClient.getSecretValue({
      SecretId: secretTag
    }, (err, data) => {
      if (err) {
        callback(err)
      } else {
        if (data.SecretString !== '') {
          try {
            callback(null, JSON.parse(data.SecretString))
          } catch (err) {
            callback(err)
          }
        } else {
          callback(new Error('SecretString is empty'))
        }
      }
    })
  }
}

module.exports = secretsManager
