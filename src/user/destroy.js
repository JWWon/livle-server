'use strict'
const User = require('./user')

module.exports = (params, respond) => {
  if(!params.body.email || !params.body.password) {
    respond(400, '이메일과 비밀번호를 입력해주세요.')
  }

  return User.dropOut(params.body.email, params.body.password)
    .then(() => respond(200))
    .catch((err) => {
      if(err === 'NOT_FOUND') {
        respond(404, '일치하는 회원 정보가 없습니다.')
      } else if (err === 'WRONG_PASSWORD') {
        respond(403, '비밀번호가 틀립니다.')
      } else {
        respond(500, err)
      }
    })
}
