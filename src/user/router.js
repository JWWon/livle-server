'use strict'

const create = require('./_create')
const get = require('./_get')
const destroy = require('./_destroy')

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
