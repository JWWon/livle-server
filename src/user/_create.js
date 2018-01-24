'use strict'
const User = require('./user')
const validator = require('email-validator')
const checker = require('email-existence')

module.exports = (params, respond) => {
  const body = params.body
  if (!body || !body.email || !body.password) {
    return respond(400, '이메일과 비밀번호를 입력해주세요.')
  }

  if (!validator.validate(body.email)) {
    return respond(405, '이메일의 형식이 잘못 되었습니다.')
  }

  checker.check(body.email, (err, valid) => {
    if (err) {
      return respond(500, '이메일 검증에 실패했습니다.')
    }
    if (valid) {
      User.signUp(body.email, body.password, body.nickname, body.fcmToken)
        .then((user) => respond(200, user))
        .catch((err) => {
          console.error(err)
          respond(403, '이미 가입되어 있는 이메일 주소입니다.')
        })
    } else {
      respond(404, '존재하지 않는 이메일 주소입니다.')
    }
  })
}
