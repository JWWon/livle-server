const S = require('sequelize')
const sequelize = require('./config/sequelize')
const bcrypt = require('bcryptjs')
const saltRounds = 5
const jwt = require('jsonwebtoken')
const secret = 'livlecardsecret'

const FreeTrial = sequelize.define('free_trial', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  card_hash: { type: S.STRING(64), unique: true, allowNull: false },
}, { createdAt: 'created_at' })

FreeTrial.check = (cardNumber) => new Promise((resolve, reject) =>
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return reject(err)
    return FreeTrial.findOne({ where: { card_hash: hash } })
    .then((record) => record ? resolve(false) : resolve(true))
    .catch((err) => reject(err))
  })
)

FreeTrial.log = (cardNumber) => new Promise((resolve, reject) =>
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return reject(err)
    return FreeTrial.create({ card_hash: hash })
      .then(() => resolve(true))
      .catch((err) => reject(err))
  })
)

module.exports = FreeTrial
