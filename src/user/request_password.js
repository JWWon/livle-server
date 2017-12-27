'use strict'

const User = require('./user')
const uuid = require('uuid/v1')
const sendEmail = require('../send-email')

module.exports = (params, respond) => {
  if (!params.query || !params.query.email) {
    respond(400, '이메일이나 비밀번호가 입력되지 않았습니다.')
  }

  return User.findOne({
    where: {
      email: params.query.email,
    },
  }).then((user) => !user ? respond(404)
    : user.update({ password_reset_token: uuid() })
  ).then((user) => sendEmail(
        user.email,
        '라이블 비밀번호 재설정 이메일',
        'request_password',
        {
          nickname: user.nickname || '라이블 유저',
          password_reset_token: user.password_reset_token,
        })
  ).then(() => respond(200))
  .catch((err) => respond(500, err))
}
