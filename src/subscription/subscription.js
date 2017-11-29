const S = require('sequelize')
const sequelize = require('../config/sequelize')

const Subscription = sequelize.define('subscription', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  latest_paid_at: S.DATE,
  last_four_digits: { type: S.STRING, allowNull: false },
  suspended_by: S.DATE
}, { createdAt: 'created_at', updatedAt: false,
  deletedAt: 'cancelled_at', paranoid: true })

module.exports = Subscription
