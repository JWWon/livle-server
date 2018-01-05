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

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.getReservations()
      .then((reservations) =>
        respond(200, _.map(reservations, sanitize))
      ).catch((err) => respond(500, err))
    ).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
