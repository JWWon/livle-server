const S = require('sequelize')
const sequelize = require('../config/sequelize')

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

const Ticket = require('../ticket/ticket')
Ticket.hasMany(Reservation, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})
Reservation.belongsTo(Ticket, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})


const Subscription = require('../subscription')
Reservation.belongsTo(Subscription, {
  foreignKey: { name: 'subscription_id', allowNull: false },
})
Subscription.hasMany(Reservation, {
  foreignKey: { name: 'subscription_id', allowNull: false },
})

module.exports = Reservation
