'use strict'
const Ticket = require('./ticket')
const Partner = require('../partner/partner')
const Artist = require('./artist')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      let options = { include: [{ model: Artist }] }
      if (!partner.isAdmin()) {
        options.where = { partner_id: partner.id }
      }
      return Ticket.findAll(options)
        .then((tickets) => respond(200, tickets))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
