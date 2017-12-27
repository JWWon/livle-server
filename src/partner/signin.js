'use strict'

const Partner = require('./partner')

module.exports = (params, respond) => {
  const username = params.query.username
  const password = params.query.password
  if (!username || !password) {
    respond(400, '유저명이나 비밀번호가 입력되지 않았습니다.')
  }

  return Partner.findOne({ where: { username: username, password: password } })
    .then((partner) => {
      if (partner.approved) {
        let partnerData = partner.dataValues
        partnerData.password = null
        partnerData.token = partner.getToken()
        return respond(200, partnerData)
      } else {
        return respond(401, '승인되지 않은 유저입니다.')
      }
    })
    .catch((err) => respond(403, '일치하는 회원 정보가 없습니다.'))
}
