'use strict'

const User = require('../user/user')
const Subscription = require('./subscription/subscription')
const Reservation = require('../reservation/reservation')
const Ticket = require('./ticket')

module.exports = (params, respond) => {
  const token = params.auth
  const path = params.path
  return User.fromToken(token)
    .then((user) =>
      user.reservable().then((reservable) => {
        if(reservable) {
          return Ticket.findBy({ id: path.ticketId })
            .then((ticket) => {
            }).catch((err) => respond(404, "공연 정보를 찾을 수 없습니다."))
        } else {
          respond(403, "구독 중인 유저가 아니거나 예약이 제한된 유저입니다.")
        }
      })
    ).catch((err) => respond(401, "로그인되지 않았습니다."))
}
