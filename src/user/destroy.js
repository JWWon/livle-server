'use strict'
const User = require('./user')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const data = JSON.parse(event.body)
  if(!data.email || !data.password) {
    return callback(null, response(400, null, "이메일과 비밀번호를 입력해주세요."))
  }

  return User.destroy({ where: { email: data.email, password: data.password } })
    .then(() => {
      return callback(null, response(200, null))
    }).catch(err => {
      return callback(null, response(403, null, "일치하는 회원정보가 없습니다."))
    })
}
