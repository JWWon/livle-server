const S = require('sequelize')
const sequelize = require('../config/sequelize')

  /*
const cookie = require('cookie')

const cookieKey = 'Authorization'
const cookiePrefix = 'Bearer '
*/

const jwt = require('jsonwebtoken')
const secret = 'livlepartnersecret'

const Partner = sequelize.define('partner', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: S.STRING, allowNull: false, unique: true },
  password: { type: S.STRING, allowNull: false },
  company: { type: S.STRING, allowNull: false },
  approved: { type: S.BOOLEAN, defaultValue: false },
},
  { timestamps: false }
)

Partner.prototype.getToken = function() {
  return jwt.sign(this.dataValues, secret)
}

Partner.fromHeaders = (headers) => new Promise( (resolve, reject) => {
  const token = ( headers && headers.Authorization ) || null
  if(!token) return reject()
  return jwt.verify(token, secret, (err, decoded) => err ? reject(err)
    : Partner.findById(decoded.id).then((partner) => resolve(partner)) )
})

const Ticket = require('../ticket/ticket')
Partner.hasMany(Ticket, {
  foreignKey: { name: 'partner_id', allowNull: false },
})

module.exports = Partner
