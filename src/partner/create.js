'use strict'
const Partner = require('./partner')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const data = JSON.parse(event.body)
  if (!data.username || !data.password || !data.company) {
    return callback(null, response(400, null, '필요한 정보를 모두 입력해주세요.'))
  }

  return Partner.create({
    username: data.username,
    password: data.password,
    company: data.company,
  })
    .then((partner) => {
      let partnerData = partner.dataValues
      partnerData.password = null
      return callback(null, response(200, partnerData))
    }).catch((err) => {
      return callback(null, response(403, null, '이미 가입되어 있는 이메일 주소입니다.'))
  })
}
