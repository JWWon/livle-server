'use strict'

const create = require('./_create')
const get = require('./_get')

module.exports = (params, respond) => {
  switch (params.httpMethod) {
    case 'POST':
      create(params, respond)
      break
    case 'GET':
      get(params, respond)
      break
    default:
      console.error(`Invalid method: ${params.httpMethod}`)
  }
}
