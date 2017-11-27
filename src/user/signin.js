'use strict'

const User = require('./user')

module.exports = (params, respond) => {
  if(!params.query.email || !params.query.password) {
    respond(400, '이메일이나 비밀번호가 입력되지 않았습니다.')
  }

  return User.findOne({
    where: {
      email: params.query.email,
      password: params.query.password,
    },
  })
    .then((user) => {
      let userData = user.dataValues
      userData.password = null
      userData.token = user.getToken()
      return respond(200, userData)
    })
    .catch((err) => respond(403, '일치하는 회원 정보가 없습니다.'))
}
