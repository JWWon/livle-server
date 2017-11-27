'use strict'

const Partner = require('./partner')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  Partner.fromHeaders(event.headers).then((partner) => {
    let partnerData = partner.dataValues
    partnerData.password = null
    return callback(null, response(200, partnerData))
  }).catch((err) => {
    if(err) {
      return callback(null, response(403, null, '유효하지 않은 세션입니다.'))
    } else{
      return callback(null, response(401, null, '로그인되지 않았습니다.'))
    }
  })
}
