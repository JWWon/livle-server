'use strict'

const User = require('../user/user')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.getReservations()
      .then((reservations) =>
        respond(200, reservations)
      ).catch((err) => respond(500, err))
    ).catch((err) =>
      respond(401, '로그인이 필요합니다.')
    )
}
