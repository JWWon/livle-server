'use strict'
const Ticket = require('./ticket')
const Partner = require('../partner/partner')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      const getTickets = () => partner.isAdmin ? Ticket.findAll()
        : Ticket.findAll({
          where: {
            partner_id: partner.id,
          },
        })
      return getTickets().then((tickets) => Ticket.withArtists(tickets, true))
        .then((tickets) => respond(200, tickets))
        .catch((err) => respond(500, err))
    }).catch((err) => respond(401, '로그인이 필요합니다.'))
}
