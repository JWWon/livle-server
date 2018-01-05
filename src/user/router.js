'use strict'

const create = require('./create')
const get = require('./get')
const destroy = require('./destroy')

module.exports = (params, respond) => {
  switch (params.httpMethod) {
    case 'post':
      create(params, respond)
      break
    case 'get':
      get(params, respond)
      break
    case 'delete':
      destroy(params, respond)
      break
    default:
      console.error('method is')
      console.error(params.httpMethod)
  }
}
