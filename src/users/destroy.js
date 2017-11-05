'use strict'
const User = require('./user')
const response = require('../response')

const isValid = (email) => {
  const regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  return regex.test(email)
}

module.exports = (event, context) => {
  const data = JSON.parse(event.body)
  if(!data.email || !data.password) {
    return context.succeed(response(400, null, "이메일과 비밀번호를 입력해주세요."))
  }

  return User.destroy({ where: { email: data.email, password: data.password } })
    .then(() => {
      return context.succeed(response(200, null))
    }).catch(err => {
      return context.succeed(response(404, null, "일치하는 회원정보가 없습니다."))
  })
}
