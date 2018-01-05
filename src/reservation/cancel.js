'use strict'

const User = require('../user/user')

module.exports = (params, respond) => {
  const token = params.auth
  const reservationId = params.path.reservationId

  return User.fromToken(token)
    .then((user) =>
      user.getReservations({ where: { id: reservationId } })
      .then((reservations) => {
        if (reservations.length === 0) return respond(404)
        const reservation = reservations[0]
        if (reservation.checked_at) return respond(405)
        reservation.cancel().then(() => respond(200))
          .catch((err) => respond(403, err))
      }).catch((err) => respond(500, err))
    ).catch((err) =>
      respond(401, '로그인이 필요합니다.')
    )
}
