'use strict'

const User = require('../user/user')
const Reservation = require('../reservation/reservation')
const sendEmail = require('../send-email')

const reserve = (ticket, subscription) => new Promise((resolve, reject) =>
  sequelize.transaction((t) =>
    Reservation.count({
      where: { ticket_id: ticket.id },
      transaction: t,
    }).then((reservedCount) => { // 해당 공연에 예약된 좌석 수
      // TODO : push vacancies
      if (reservedCount >= ticket.capacity) throw new Error('no vacancy')

      return Reservation.count({
        where: { subscription_id: subscription.id },
        transaction: t,
      }).then((usedCount) => { // 현재 구독에서 이용한 예약 기회
        if (usedCount >= 2) throw new Error('used up')

        return Reservation.upsert({
          ticket_id: ticket.id,
          subscription_id: subscription.id,
          reserved_at: new Date(),
          cancelled_at: null,
        }, {
          transaction: t,
        })
    })
    })
  ).then((created) =>
    Reservation.findOne({
      where: {
        ticket_id: ticket.id,
        subscription_id: subscription.id,
      },
    })
  ).then((result) => resolve(result)
  ).catch((err) => reject(err))
)

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
              const minute = date.getMinutes()
              const h = hour > 12 ? hour - 12 : hour
              const hh = h < 10 ? '0' + h : h

              return `${hour > 11 ? 'PM' : 'AM'} ${hh}:${minute}`
            }

            return sendEmail(user.email, '라이블 공연 예약', 'reservation',
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

            return reserve(ticket, user, sub)
              .then((reservation) =>
                sendReservationEmail(user, ticket)
                .then((sent) => respond(200, reservation))
              ).catch((err) => respond(405, err))
          })
      }).catch((err) => respond(500, err))
    ).catch((err) => respond(401, '로그인되지 않았습니다.'))
}
