const S = require('sequelize')
const sequelize = require('../config/sequelize')

module.exports = sequelize.define('user', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  email: S.STRING,
  nickname: S.STRING,
  password: S.STRING,
  expire_at: S.DATE,
  is_subscribing: S.BOOLEAN
})
