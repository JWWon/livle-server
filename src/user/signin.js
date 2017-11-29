'use strict'

const User = require('./user')
const R = User.REJECTIONS

module.exports = (params, respond) => {
  if (!params.query.email || !params.query.password) {
    respond(400, '이메일이나 비밀번호가 입력되지 않았습니다.')
  }

  return User.signIn(params.query.email, params.query.password)
    .then((user) => respond(200, user))
    .catch((err) => {
      if (err === R.NOT_FOUND) {
        respond(404, '일치하는 회원 정보가 없습니다.')
      } else if (err === R.WRONG_PASSWORD) {
        respond(403, '비밀번호가 틀립니다.')
      } else {
        respond(500, err)
      }
    })
}
