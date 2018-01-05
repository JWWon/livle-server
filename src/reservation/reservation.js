const S = require('sequelize')
const sequelize = require('../config/sequelize')
const pusher = require('../config/pusher')

const Reservation = sequelize.define('reservation', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  reserved_at: { type: S.DATE, allowNull: false },
  checked_at: S.DATE,
  // 공연 시작시간까지 체크인하지 않은 경우,
  // 서버에서 자동 취소 및 노쇼 패널티 부여
}, {
  deletedAt: 'cancelled_at', paranoid: true,
  createdAt: 'created_at', updatedAt: 'updated_at',
  indexes: [{
    unique: true,
    fields: ['subscription_id', 'ticket_id'],
  }],
})

const pushVacancies = (ticket, reservedCount) =>
  new Promise((resolve, reject) =>
    Reservation.count({ where: { ticket_id: ticket.id } })
    .then((reservedCount) => {
      const callback = (err) => {
        if (err) {
          console.error(err)
          resolve(false)
        } else {
          resolve(true)
        }
      }
      pusher.trigger('vacancies', `ticket-${ticket.id}`,
        ticket.capacity - reservedCount, null, callback)
    })
  )

Reservation.reserve = (ticket, subscription) =>
  new Promise((resolve, reject) =>
    sequelize.transaction((t) =>
      Reservation.count({
        where: { ticket_id: ticket.id },
        transaction: t,
      }).then((reservedCount) => { // 해당 공연에 예약된 좌석 수
        if (reservedCount >= ticket.capacity) throw new Error('no vacancy')

        return Reservation.count({
          where: { subscription_id: subscription.id },
          transaction: t,
        }).then((usedCount) => { // 현재 구독에서 이용한 예약 기회
          if (usedCount >= 2) throw new Error('used up')

          return Reservation.findOne({
            where: {
              ticket_id: ticket.id,
              subscription_id: subscription.id,
            },
            paranoid: false,
            transaction: t,
          }).then((reservation) => {
            if (reservation && !reservation.isSoftDeleted()) {
              throw new Error('already reserved')
            }
            return Reservation.upsert({
              ticket_id: ticket.id,
              subscription_id: subscription.id,
              reserved_at: new Date(),
              cancelled_at: null,
            }, { transaction: t })
          })
        })
      })
    ).then((created) =>
      Reservation.findOne({
        where: {
          ticket_id: ticket.id,
          subscription_id: subscription.id,
        },
        attributes: [
          'id',
          ['ticket_id', 'ticketId'],
          ['reserved_at', 'reservedAt'],
        ],
      })
    ).then((reservation) =>
      pushVacancies(ticket).then((pushed) => resolve(reservation))
    ).catch((err) => reject(err))
  )

const hoursLeft = (until) => {
  const now = new Date()
  return (until - now) / 36e5
}

Reservation.prototype.cancel = function() {
  return new Promise((resolve, reject) => {
    if (this.checked_at) {
      reject(new Error('체크인 한 공연입니다.'))
    } else {
      this.getTicket().then((ticket) => {
        if (hoursLeft(ticket.start_at) < 4) {
          reject(new Error('4시간 전까지만 취소할 수 있습니다.'))
        } else {
          this.destroy().then(() => pushVacancies(ticket))
            .then((pushed) => resolve(200))
        }
      })
    }
  })
}

module.exports = Reservation
