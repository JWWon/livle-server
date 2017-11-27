'use strict'
const User = require('./user')

module.exports = (params, respond) => {
  if(!params.body.email || !params.body.password) {
    respond(400, '이메일과 비밀번호를 입력해주세요.')
  }

  return User.destroy({
    where: {
      email: params.body.email,
      password: params.body.password,
    },
  })
    .then(() => respond(200)
    ).catch((err) => respond(403, '일치하는 회원정보가 없습니다.'))
}
