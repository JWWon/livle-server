const S = require('sequelize')
const sequelize = require('../config/sequelize')

const Subscription = sequelize.define('subscription', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  paid_at: S.DATE,
  valid_by: { type: S.DATE, allowNull: false },
}, { createdAt: 'created_at' })

module.exports = Subscription
