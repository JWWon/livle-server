'use strict'

const User = require('./user')
const response = require('../response')

module.exports = (params, respond) => {
  if(!params.auth) return respond(401, '로그인되지 않았습니다.')

  return User.fromToken(params.auth)
    .then(user => respond(200, user.dataValues))
    .catch(err => respond(403, "유효하지 않은 세션입니다."))
}