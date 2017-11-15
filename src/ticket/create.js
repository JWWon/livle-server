'use strict'
const Partner = require('../partner/partner')
const Ticket = require('../ticket/ticket')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  return Partner.fromHeaders(event.headers)
    .then(partner => {
      var data = JSON.parse(event.body)
      data.partnerId = partner.dataValues.id
      return Ticket.create(data)
        .then(ticket => {
          return callback(null, response(200, ticket.dataValues))
        })
        .catch(err => {
          return callback(null, response(400, null, "잘못된 데이터입니다."))
        })
    }).catch(err => {
      return callback(new Error("[401] 로그인 해주세요."))
    })
}
