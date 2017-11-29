'use strict'

const User = require('../user/user')
const Reservation = require('../reservation/reservation')

module.exports = (params, respond) => {
  const token = params.auth
  const path = params.path
  return User.fromToken(token)
    .then((user) =>
      Reservation.make(user, path.ticketId)
      .then((reservation) => respond(200, reservation))
      .catch((err) => { console.error(err); respond(400, err)})
    ).catch((err) => respond(401, '로그인되지 않았습니다.'))
}
