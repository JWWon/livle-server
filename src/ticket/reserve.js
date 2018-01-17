'use strict'

const User = require('../user/user')
const Ticket = require('../ticket/ticket')
const Reservation = require('../reservation/reservation')
const sendEmail = require('../send-email')

module.exports = (params, respond) => {
  const token = params.auth
  const path = params.path
  return User.fromToken(token)
    .then((user) =>
      Ticket.findOne({ where: { id: path.ticketId } })
      .then((ticket) => {
        if (!ticket) return respond(404)
        if (ticket.start_at < new Date()) return respond(400, '이미 시작한 공연입니다.')

        const sendReservationEmail = () =>
          new Promise((resolve, reject) => {
            const formatDate = (date) => {
              const hour = date.getHours()
              const h = hour > 12 ? hour - 12 : hour
              const hh = h < 10 ? '0' + h : h

              const m = date.getMinutes()
              const mm = m < 10 ? '0' + m : m

              return `${hour > 11 ? 'PM' : 'AM'} ${hh}:${mm}`
            }

            return sendEmail(user.email, '라이블 공연이 예약되었습니다.',
              'reservation',
              {
                nickname: user.nickname,
                title: ticket.title,
                place: ticket.place,
                startAt: formatDate(ticket.start_at),
              }).then(() => resolve(true))
              .catch((err) => {
                console.error(err)
                return resolve(false)
              })
          })

        return user.subscriptionFor(ticket.start_at)
          .then((sub) => {
            if (!sub) return respond(403, '유효한 구독이 없습니다.')

            return Reservation.reserve(ticket, sub)
              .then((reservation) =>
                sendReservationEmail(user, ticket)
                .then((sent) => respond(200, reservation))
              ).catch((err) => {
                console.error(err)
                respond(405, err)
              })
          })
      }).catch((err) => respond(500, err))
    ).catch((err) => respond(401, '로그인되지 않았습니다.'))
}
