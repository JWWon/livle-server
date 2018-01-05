'use strict'

const User = require('../user/user')

module.exports = (params, respond) => {
  const token = params.auth
  const rId = params.path.reservationId
  if (!rId) return respond(400, '예약 아이디가 없습니다.')

  return User.fromToken(token)
    .then((user) =>
      user.getReservations({ where: { id: rId } })
      .then((reservations) => {
        if (reservations.length === 0) {
          return respond(404, '해당 예약을 찾을 수 없습니다.')
        }
        const r = reservations[0]
        if (r.checked_at) return respond(405, '이미 체크인되었습니다.')

        return r.getTicket()
          .then((t) => {
            if (t.checkin_code === params.body.code) {
              return r.update({ checked_at: new Date() })
                .then((r) => respond(200, r.dataValues))
            } else {
              respond(403, '체크인 코드가 틀립니다.') // TODO code
            }
          })
      }).catch((err) => {
        console.error(err); respond(500)
      })
    ).catch((err) =>
      respond(401, '로그인이 필요합니다.')
    )
}
