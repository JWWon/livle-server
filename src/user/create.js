'use strict'
const User = require('./user')
const response = require('../response')

const isValid = (email) => {
  const regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  return regex.test(email)
}

module.exports = (event, context, callback) => {
  //context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body)
  if(!data.email || !data.password) {
    return callback(null, response(400, null, "이메일과 비밀번호를 입력해주세요."))
  }

  if(!isValid(data.email))
    return callback(null, response(405, null, "이메일의 형식이 잘못 되었습니다."))

  return User.create({ email: data.email, password: data.password })
    .then((user) => {
      var userData = user.dataValues
      userData.token = user.getToken()
      return callback(null, response(200, userData))
    }).catch(err => {
      return callback(null, response(403, null, "이미 가입되어 있는 이메일 주소입니다."))
  })
}
