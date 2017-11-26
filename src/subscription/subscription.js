const S = require('sequelize')
const sequelize = require('../config/sequelize')

const Subscription = sequelize.define('subscription', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  cancelled_at : S.DATE,
  latest_paid_at : S.DATE
}, { createdAt: 'created_at',
  updatedAt: false })

module.exports = Subscription
