'use strict'

const User = require('../user/user')
const _ = require('lodash')

const sanitize = (reservation) => _.reduce(reservation.dataValues,
  (result, value, key) => {
    switch (key) {
      case 'reserved_at':
        result.reservedAt = value
        break
      case 'checked_at':
        result.checkedAt = value
        break
      case 'ticket_id':
        result.ticketId = value
        break
      case 'id':
        result[key] = value
      default:
        break
    }
    return result
  }, { })

const ticketAttrs = [
  ['start_at', 'startAt'],
  ['end_at', 'endAt'],
  'title',
  'place',
]

module.exports = (params, respond) => {
  const token = params.auth
  const now = new Date()

  return User.fromToken(token)
    .then((user) =>
      user.getReservations({
        where: { checked_at: null },
      }).then((reservations) => {
        Promise.all(
          _.map(reservations, (r) => r.getTicket({ attributes: ticketAttrs }))
        ).then((tickets) => {
          const result = _.map(reservations, (r, i) => {
            const ticket = tickets[i]
            if (ticket.endAt > now) return null
            let sanitizedReservation = sanitize(r)
            sanitizedReservation.ticket = ticket.dataValues
            return sanitizedReservation
          })
          respond(200, _.filter(result, (r) => !!r))
        })
      }).catch((err) => respond(500, err))
    ).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
