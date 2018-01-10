'use strict'
const User = require('./user')
const validator = require('email-validator')
const checker = require('email-existence')

module.exports = (params, respond) => {
  const email = params.body.email
  const password = params.body.password
  if (!email || !password) {
    return respond(400, '이메일과 비밀번호를 입력해주세요.')
  }

  if (!validator.validate(email)) {
    return respond(405, '이메일의 형식이 잘못 되었습니다.')
  }

  checker.check(email, (err, valid) => {
    if (err) {
      return respond(500, '이메일 검증에 실패했습니다.')
    }
    if (valid) {
      User.signUp(params.body.email, params.body.password,
        params.body.nickname)
        .then((user) => respond(200, user))
        .catch((err) => respond(403, '이미 가입되어 있는 이메일 주소입니다.'))
    } else {
      respond(404, '존재하지 않는 이메일 주소입니다.')
    }
  })
}
