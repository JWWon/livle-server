const S = require('sequelize')
const sequelize = require('../config/sequelize')
const Ticket = require('../ticket/ticket')

const Reservation = sequelize.define('reservation', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  status: { type: S.ENUM('valid', 'noshow', 'checked'), allowNull: false },
  checked_at: S.DATE,
}, { createdAt: 'created_at', updatedAt: false,
  deletedAt: 'cancelled_at', paranoid: true,
  indexes: [{
    unique: true,
    fields: ['user_id', 'ticket_id'],
    where: {
      deleted_at: null
    }
  }]})

Reservation.REJECTIONS = { TICKET_NOT_FOUND: 'ticket_not_found', OVERDUE: 'overdue', NO_VANCANCY: 'no_vacancy' }
const R = Reservation.REJECTIONS
Reservation.make = (user, ticket_id) =>
  new Promise((resolve, reject) =>
    Ticket.find_by({ id: ticket_id })
    .then((ticket) => {
      if(ticket.start_at > new Date()) {
        return reject(R.OVERDUE)
      }
      return S.transaction((t) =>
        ticket.getReservations({ transaction: t })
        .then((reservations) => {
          if(reservations.count < ticket.capacity) {
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
    }).catch((err) => reject(R.TICKET_NOT_FOUND))
  )

module.exports = Reservation
