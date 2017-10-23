'use strict';
const User = require('./user')
const response = require('../response')

module.exports = (event, context) => {
  const data = JSON.parse(event.body)
  if(!data.email || !data.password) {
    return context.succeed(response(400, null, "이메일과 비밀번호를 입력해주세요."))
  }
  // TODO validate email

  // TODO duplicate check
  return User.create(data).then(user => {
    const userData = user.dataValues
    userData.token = user.getToken()
    return context.succeed(response(200, userData))
  }).catch(err => {
    return context.fail(err)
  })
}
