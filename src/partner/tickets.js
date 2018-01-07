'use strict'

const Partner = require('./partner')
const Artist = require('../ticket/artist')
const Ticket = require('../ticket/ticket')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')
  // 이 파트너의 공연 정보를 가져오고자 합니다.
  const partnerId = params.path && params.path.partnerId

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (partner.id !== partnerId) {
        return respond(403, '권한이 없습니다.')
      }
      partner.getTickets({ include: [{ model: Artist }] })
        .then((tickets) => Ticket.withReservedCount(tickets))
        .then((tickets) => respond(200, tickets))
        .catch((err) => {
          console.error(err)
          respond(500, err)
        })
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
