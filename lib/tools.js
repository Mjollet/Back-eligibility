'use strict'

const Tools = {
  boolToOKNOK: (bool) => {
    return bool ? 'OK' : 'NOK'
  },

  objectToArray: (object) => {
    var array = []
    for (var i in object) {
      if (object.hasOwnProperty(i)) {
        array.push(object[i])
      }
    }
    return array
  },

  arrayToObject: (array, keyName) => {
    let obj = {}
    array.forEach(item => {
      if (typeof item !== 'object') {
        throw new Error(`Array contains an item which is not an object: ${item}`)
      }
      if (!obj.hasOwnProperty(item[keyName])) {
        obj[item[keyName]] = item
      } else {
        throw new Error(`Property ${item[keyName]} already exists in the object`)
      }
    })
    return obj
  }
}

module.exports = Tools
