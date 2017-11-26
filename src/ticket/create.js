'use strict'
const Partner = require('../partner/partner')
const Ticket = require('../ticket/ticket')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  return Partner.fromHeaders(event.headers)
    .then(partner => {
      if(partner.username != "admin@livle.kr") {
        return callback(new Error("[403] 관리자만 추가할 수 있습니다."))
      }
      let data = JSON.parse(event.body)
      data.partner_id = partner.id
      return Ticket.create(data)
        .then(ticket => {
          return callback(null, response(200, ticket.dataValues))
        })
        .catch(err => {
          console.error(err)
          return callback(null, response(400, null, JSON.stringify(err)))
        })
    }).catch(err => {
      return callback(new Error("[401] 로그인 해주세요."))
    })
}
