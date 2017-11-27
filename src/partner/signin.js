'use strict'

const Partner = require('./partner')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const username = event.queryStringParameters.username
  const password = event.queryStringParameters.password
  if(!username || !password) {
callback(new Error('[400] 유저명이나 비밀번호가 입력되지 않았습니다.'))
}

  return Partner.findOne({ where: { username: username, password: password } })
    .then((partner) => {
      if(partner.approved) {
        let partnerData = partner.dataValues
        partnerData.password = null
        partnerData.token = partner.getToken()
        return callback(null, response(200, partnerData))
      } else{
        return callback(null, response(401, null, '승인되지 않은 유저입니다.'))
      }
    })
    .catch((err) => callback(null, response(403, null, '일치하는 회원 정보가 없습니다.')))
}
