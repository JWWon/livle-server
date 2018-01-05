'use strict'

const User = require('../user/user')

const hoursLeft = (until) => {
  const now = new Date()
  return (until - now) / 36e5
}

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
        return reservation.getTicket()
          .then((ticket) =>
            // 4시간 전까지만 취소 가능
            hoursLeft(ticket.start_at) < 4 ? respond(405)
          : reservation.destroy().then(() => respond(200))
        )
      }).catch((err) => respond(500, err))
    ).catch((err) =>
      respond(401, '로그인이 필요합니다.')
    )
}
