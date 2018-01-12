'use strict'

const User = require('./user')
const R = User.REJECTIONS

module.exports = (params, respond) => {
  const body = params.body
  if (!body || !body.email || !body.password) {
    respond(400, '이메일이나 비밀번호가 입력되지 않았습니다.')
  }

  return User.signIn(body.email, body.password, body.fcmToken)
    .then((user) => {
      if (user) {
        respond(200, user)
      } else {
        respond(404, '일치하는 회원 정보가 없습니다.')
      }
    }).catch((err) => {
      if (err === R.WRONG_PASSWORD) {
        respond(403, '비밀번호가 틀립니다.')
      } else {
        respond(500, err)
      }
    })
}
