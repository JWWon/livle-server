'use strict'
const Partner = require('./partner')

module.exports = (params, respond) => {
  const data = params.body
  if (!data.username || !data.password || !data.company) {
    return respond(400, '필요한 정보를 모두 입력해주세요.')
  }

  return Partner.create({
    username: data.username,
    password: data.password,
    company: data.company,
  })
    .then((partner) => {
      let partnerData = partner.dataValues
      partnerData.password = null
      return respond(200, partnerData)
    }).catch((err) => {
      return respond(403, '이미 가입되어 있는 이메일 주소입니다.')
  })
}
