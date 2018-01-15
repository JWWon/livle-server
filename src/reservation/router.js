'use strict'

const get = require('./get')
const checkin = require('./checkin')
const cancel = require('./cancel')

module.exports = (params, respond) => {
  switch (params.httpMethod) {
    case 'POST':
      checkin(params, respond)
      break
    case 'GET':
      get(params, respond)
      break
    case 'DELETE':
      cancel(params, respond)
      break
    default:
      console.error(`Invalid method: ${params.httpMethod}`)
  }
}
