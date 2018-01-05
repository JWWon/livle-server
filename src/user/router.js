'use strict'

const create = require('./create')
const get = require('./get')
const destroy = require('./destroy')

module.exports = (params, respond) => {
  switch (params.httpMethod) {
    case 'POST':
      create(params, respond)
      break
    case 'GET':
      get(params, respond)
      break
    case 'DELETE':
      destroy(params, respond)
      break
    default:
      console.error(`Invalid method: ${params.httpMethod}`)
  }
}
