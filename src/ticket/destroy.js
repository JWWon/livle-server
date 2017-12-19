'use strict'
const Partner = require('../partner/partner')
const Ticket = require('./ticket')
const Artist = require('./artist')

const destroyTicket = (ticket) => Artist.destroy({
  where: {
    ticket_id: ticket.id,
  },
}).then(() => ticket.destroy())


module.exports = (params, respond) =>
  Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => !partner.isAdmin() ?
      respond(403, '관리자만 삭제할 수 있습니다.')
      : Ticket.findOne({
        where: {
          id: params.path.ticketId,
        },
      }).then((ticket) => {
        if (!ticket) return respond(404)
        return ticket.getReservations()
          .then((reservations) => reservations.length > 0 ?
            respond(405, '예약 내역이 있는 공연입니다.')
            : destroyTicket(ticket).then(() => respond(200))
          )
      }).catch((err) => respond(500, err) )
    ).catch((err) => respond(401, '로그인 해주세요.'))
