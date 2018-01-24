const S = require('sequelize')
const sequelize = require('../config/sequelize')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const secret = 'livlepartnersecret'

const Partner = sequelize.define('partner', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  username: { type: S.STRING(32), allowNull: false, unique: true },
  password: { type: S.STRING, allowNull: false },
  company: { type: S.STRING, allowNull: false },
  approved: { type: S.BOOLEAN, defaultValue: false },
},
  { createdAt: 'created_at', updatedAt: 'updated_at' },
)

const tokenData = (data) =>
  _.pick(data, ['id', 'username', 'password', 'company', 'approved'])

Partner.prototype.getToken = function() {
  return jwt.sign(tokenData(this.dataValues), secret)
}

Partner.prototype.isAdmin = function() {
  return this.approved && this.username.endsWith('@livle.kr')
}

Partner.fromHeaders = (headers) => new Promise( (resolve, reject) => {
  const token = ( headers && headers.Authorization ) || null
  if (!token) return reject()
  return jwt.verify(token, secret, (err, decoded) => {
    if (err) return reject(err)
    Partner.findOne({ where: tokenData(decoded) })
      .then((partner) => resolve(partner))
  })
})

const Ticket = require('../ticket/ticket')
Partner.hasMany(Ticket, {
  foreignKey: { name: 'partner_id', allowNull: false },
})

module.exports = Partner
