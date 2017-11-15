'use strict'

const Partner = require('./partner')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const username = event.queryStringParameters.username
  const password = event.queryStringParameters.password
  if(!username || !password) callback(new Error("[400] 유저명이나 비밀번호가 입력되지 않았습니다."))

  return Partner.findOne({ where: { username: username, password: password } })
    .then(partner => {
      var partnerData = partner.dataValues
      partnerData.password = null
      return callback(null, response(200, partnerData, null, { "Set-Cookie": partner.getCookie() }))
    })
    .catch(err => callback(null, response(403, null, "일치하는 회원 정보가 없습니다.")))
}
