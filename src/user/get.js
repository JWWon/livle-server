'use strict'

const User = require('./user')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const token = event.headers.Authorization
  if(!token) return callback(new Error("[401] 로그인되지 않았습니다."))

  return User.fromToken(token)
    .then(user => callback(null, response(200, user.dataValues)))
    .catch(err => callback(new Error("[403] 유효하지 않은 세션입니다.")))
}
