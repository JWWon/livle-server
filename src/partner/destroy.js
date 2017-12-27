'use strict'
const Partner = require('./partner')

module.exports = (params, respond) => {
  const data = params.body
  if (!data.username || !data.password) {
    return respond(400, '아이디와 비밀번호를 입력해주세요.')
  }

  return Partner.destroy({
    where: {
      username: data.username,
      password: data.password,
    },
  }).then(() => {
    return respond(200)
  }).catch((err) => {
    return respond(403, '일치하는 회원정보가 없습니다.')
  })
}
