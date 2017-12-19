'use strict'
const Partner = require('../partner/partner')
const Ticket = require('./ticket')
const Artist = require('./artist')
const _ = require('lodash')

module.exports = (params, respond) =>
  Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin()) {
        return respond(403, '관리자만 수정할 수 있습니다.')
      }
      const artistParams = params.body.artists || []
      const ticketParam = _.omit(params.body, 'artists')
      return Ticket.findOne({
        where: {
          id: params.path.ticketId,
        },
      }).then((ticket) => {
        if (!ticket) respond(404)
        return ticket.update(ticketParam)
          .then((ticket) =>
            Artist.destroy({ where: { ticket_id: ticket.id } })
            .then(() => {
              Promise.all(
                _.map(artistParams,
                  (a) => Artist.create(
                    _.assignIn(a, { id: undefined, ticket_id: ticket.id })
                  )
                )
              ).then((artists) => {
                let ticketData = ticket.dataValues
                ticketData.artists = artists
                return respond(200, ticketData)
              })
            })
          )
      }).catch((err) => respond(500, err))
    }).catch((err) => {
      return respond(401, '로그인 해주세요.')
    })
