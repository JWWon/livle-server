'use strict'
const Partner = require('../partner/partner')
const Ticket = require('./ticket')
const Artist = require('./artist')
const _ = require('lodash')

module.exports = (params, respond) =>
  Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (partner.username != 'admin@livle.kr') {
        return respond(403, '관리자만 추가할 수 있습니다.')
      }
      const artistParams = params.body.artists || []
      const ticketParam = _.omit(params.body, 'artists')
      ticketParam.partner_id = partner.id
      return Ticket.create(ticketParam)
        .then((ticket) =>
          Promise.all(
            _.map(artistParams,
              (a) => Artist.create(_.assignIn(a, { ticket_id: ticket.id })))
          ).then((artists) => {
            let ticketData = ticket.dataValues
            ticketData.artists = artists
            return respond(200, ticketData)
          })
        )
        .catch((err) => respond(400, err))
    }).catch((err) => {
      return respond(401, '로그인 해주세요.')
    })
