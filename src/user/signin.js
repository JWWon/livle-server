'use strict'

const User = require('./user')

module.exports = (params, respond) => {
  if(!params.query.email || !params.query.password) {
    respond(400, '이메일이나 비밀번호가 입력되지 않았습니다.')
  }

  return User.signIn(params.query.email, params.query.password)
    .then((user) => respond(200, user))
    .catch((err) => {
      if(err === 'SUBSCRIBING') {
        respond(405, '탈퇴 전에 구독을 취소해야 합니다.')
      } else if(err === 'NOT_FOUND') {
        respond(404, '일치하는 회원 정보가 없습니다.')
      } else if (err === 'WRONG_PASSWORD') {
        respond(403, '비밀번호가 틀립니다.')
      } else {
        respond(500, err)
      }
    })
}
