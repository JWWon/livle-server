const S = require('sequelize')
const sequelize = require('../config/sequelize')

const Subscription = sequelize.define('subscription', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  valid_by: S.DATE,
  last_four_digits: { type: S.STRING, allowNull: false },
  suspended_by: S.DATE,
  cancelled_at: S.DATE,
}, { createdAt: 'created_at', updatedAt: 'updated_at', })

module.exports = Subscription
