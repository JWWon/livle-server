'use strict'
const User = require('./user')
const R = User.REJECTIONS

module.exports = (params, respond) => {
  const body = params.body
  if (!body || !body.email || !body.password) {
    respond(400, '이메일과 비밀번호를 입력해주세요.')
  }

  return User.dropOut(params.body.email, params.body.password)
    .then((success) => {
      if (success) {
        respond(200)
      } else {
        respond(404, '일치하는 회원 정보가 없습니다.')
      }
    }).catch((err) => {
      if (err === R.SUBSCRIBING) {
        respond(405, '탈퇴 전에 구독을 취소해야 합니다.')
      } else if (err === R.WRONG_PASSWORD) {
        respond(403, '비밀번호가 틀립니다.')
      } else {
        respond(500, err)
      }
    })
}
