'use strict'

const create = require('./create')
const update = require('./update')
const cancel = require('./cancel')

module.exports = (params, respond) => {
  switch (params.httpMethod) {
    case 'POST':
      create(params, respond)
      break
    case 'PATCH':
      update(params, respond)
      break
    case 'DELETE':
      cancel(params, respond)
      break
    default:
      console.error(`Invalid method: ${params.httpMethod}`)
  }
}
