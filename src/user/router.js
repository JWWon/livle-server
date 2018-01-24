'use strict'

const create = require('./_create')
const get = require('./_get')
const destroy = require('./_destroy')
const signin = require('./_signin')
const facebook = require('./_facebook')
const requestPassword = require('./_request-password')
const updatePassword = require('./_update-password')
const list = require('./_list')

const invalidMethod = (params, respond) =>
  respond(500, `Invalid method ${params.httpMethod}`)

const userRouter = (params, respond) => {
  switch (params.httpMethod) {
    case 'POST':
      return create(params, respond)
    case 'GET':
      return get(params, respond)
    case 'DELETE':
      return destroy(params, respond)
    default:
      return invalidMethod(params, respond)
  }
}

module.exports = (params, respond) => {
  const paths = params.fullPath.split('?')[0].split('/')
  const len = paths.length
  const lastFrag = paths[len-1]
  const method = params.httpMethod
  // fullPath에 basePath가 포함되어서 마지막 Frag로 구분
  switch (lastFrag) {
    case 'user':
      return userRouter(params, respond)
    case 'session':
      if (method !== 'POST') {
        return invalidMethod(params, respond)
      }
      return signin(params, respond)
    case 'facebook':
      if (method !== 'POST') {
        return invalidMethod(params, respond)
      }
      return facebook(params, respond)
    case 'password':
      switch (method) {
        case 'GET':
          return requestPassword(params, respond)
        case 'POST':
          return updatePassword(params, respond)
        default:
          return invalidMethod(params, respond)
      }
    case 'list':
      if (method !== 'GET') {
        return invalidMethod(params, respond)
      }
      return list(params, respond)
    default:
      respond(500, `Invalid path ${params.fullPath}`)
  }
}
