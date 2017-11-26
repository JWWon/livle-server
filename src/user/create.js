'use strict'
const User = require('./user')
const validator = require('email-validator')

module.exports = (params, respond) => {
  if(!params.body.email || !params.body.password) {
    return respond(400, "이메일과 비밀번호를 입력해주세요.")
  }

  if(!validator.validate(params.body.email)) {
    return respond(405, "이메일의 형식이 잘못 되었습니다.")
  }

  return User.create({ email: params.body.email, password: params.body.password })
    .then(user => {
      var userData = user.dataValues
      userData.password = null
      userData.token = user.getToken()
      return respond(200, userData)
    }).catch(err => {
      return respond(403, "이미 가입되어 있는 이메일 주소입니다.")
  })
}
