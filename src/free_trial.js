const S = require('sequelize')
const sequelize = require('./config/sequelize')
const sha512 = require("crypto-js/sha512")

const hash = (str) => sha512(str).toString()

const FreeTrial = sequelize.define('free_trial', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  card_hash: { type: S.STRING(128), unique: true, allowNull: false },
}, { createdAt: 'created_at' })

FreeTrial.check = (cardNumber) => new Promise((resolve, reject) =>
  FreeTrial.findOne({ where: { card_hash: hash(cardNumber) } })
  .then((record) => record ? resolve(false) : resolve(true))
  .catch((err) => reject(err))
)

FreeTrial.log = (cardNumber) => new Promise((resolve, reject) =>
  FreeTrial.create({ card_hash: hash(cardNumber) })
  .then((record) => resolve(record))
  .catch((err) => reject(err))
)

module.exports = FreeTrial
