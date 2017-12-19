const S = require('sequelize')
const sequelize = require('../config/sequelize')

const Reservation = sequelize.define('reservation', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  status: { type: S.ENUM('valid', 'noshow', 'checked'), allowNull: false },
  checked_at: S.DATE,
}, { createdAt: 'created_at', updatedAt: false,
  deletedAt: 'cancelled_at', paranoid: true,
  indexes: [{
    unique: true,
    fields: ['user_id', 'ticket_id'],
    where: {
      deleted_at: null,
    },
  }] })

Reservation.REJECTIONS = {
  TICKET_NOT_FOUND: 'ticket_not_found',
  OVERDUE: 'overdue',
  NO_VANCANCY: 'no_vacancy',
}

const R = Reservation.REJECTIONS

const Ticket = require('../ticket/ticket')
Ticket.hasMany(Reservation, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})
Reservation.belongsTo(Ticket, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})

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
      return user.reservable().then((reservable) => {
        if (reservable !== true) return reject(reservable)
        return sequelize.transaction((t) =>
          ticket.getReservations({ transaction: t })
          .then((reservations) => {
            if (reservations.length < ticket.capacity) {
              return Reservation.create({
                ticket_id: ticket.id,
                user_id: user.id,
                status: 'valid' },
                { transaction: t })
            } else {
              throw new Error(R.NO_VANCANCY)
            }
          })
        ).then((result) => resolve(result))
          .catch((err) => reject(err))
      }).catch((err) => reject(err))
    }).catch((err) => {
 console.error(err); reject(R.TICKET_NOT_FOUND)
})
  )

module.exports = Reservation
