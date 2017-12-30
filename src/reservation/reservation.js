const S = require('sequelize')
const sequelize = require('../config/sequelize')
const sendEmail = require('../send-email')

const Reservation = sequelize.define('reservation', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  status: { type: S.ENUM('valid', 'noshow', 'checked'), allowNull: false },
  reserved_at: { type: S.DATE, allowNull: false },
  checked_at: S.DATE,
}, {
  deletedAt: 'cancelled_at', paranoid: true,
  indexes: [{
    unique: true,
    fields: ['user_id', 'ticket_id'],
  }],
})

Reservation.REJECTIONS = {
  TICKET_NOT_FOUND: 'ticket_not_found',
  OVERDUE: 'overdue',
  NO_VANCANCY: 'no_vacancy',
  NO_VALID_SUBSCRIPTION: 'no_valid_subscription',
}

const R = Reservation.REJECTIONS

const Ticket = require('../ticket/ticket')
Ticket.hasMany(Reservation, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})
Reservation.belongsTo(Ticket, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})

const formatDate = (date) => {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const h = hour > 12 ? hour - 12 : hour
  const hh = h < 10 ? '0' + h : h

  return `${hour > 11 ? 'PM' : 'AM'} ${hh}:${minute}`
}

const reserve = (ticket, user) => new Promise((resolve, reject) =>
  sequelize.transaction((t) =>
    Reservation.count({
      where: { ticket_id: ticket.id },
      transaction: t,
    }).then((rCount) => {
      if (rCount < ticket.capacity) {
        return Reservation.upsert({
          ticket_id: ticket.id,
          user_id: user.id,
          status: 'valid',
          reserved_at: new Date(),
          cancelled_at: null,
        }, {
          transaction: t,
        })
      } else {
        throw new Error(R.NO_VANCANCY)
      }
    })
  ).then((created) =>
    Reservation.findOne({
      where: {
        ticket_id: ticket.id,
        user_id: user.id,
      },
    })
  ).then((result) =>
    sendEmail(user.email, '라이블 공연 예약', 'reservation',
      {
        nickname: user.nickname,
        title: ticket.title,
        place: ticket.place,
        startAt: formatDate(ticket.start_at),
      }).then(() => resolve(result))
    .catch((err) => {
      console.error(err) // 예약되었으나 이메일만 보내지지 않은 경우
      return resolve(result)
    })
  ).catch((err) => reject(err) )
)

Reservation.make = (user, ticketId) =>
  new Promise((resolve, reject) =>
    Ticket.findOne({
      where: {
        id: ticketId,
      },
    }).then((ticket) => {
      if (ticket.start_at < new Date()) {
        return reject(R.OVERDUE)
      }
      if (user.reservable(ticket.start_at)) {
        return reserve(ticket, user)
          .then((result) => resolve(result))
          .catch((err) => reject(err))
      } else {
        return reject(R.NO_VALID_SUBSCRIPTION)
      }
    }).catch((err) => reject(R.TICKET_NOT_FOUND))
  )

module.exports = Reservation
