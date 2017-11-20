const S = require('sequelize')
const sequelize = require('../config/sequelize')

const cookie = require('cookie')

const cookieKey = 'Authorization'
const cookiePrefix = 'Bearer '

const jwt = require('jsonwebtoken')
const secret = 'livlepartnersecret'

const Partner = sequelize.define('partner', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: S.STRING, allowNull: false, unique: true },
  password: { type: S.STRING, allowNull: false },
  company: { type: S.STRING, allowNull: false },
  approved: { type: S.BOOLEAN, defaultValue: false }
},
  { timestamps: false }
)

Partner.prototype.getCookie = function() {
  const token = jwt.sign(this.dataValues, secret)
  const sessionId = `${cookiePrefix}${token}`
  const newCookie = cookie.serialize(cookieKey, sessionId, { path: '/' })
  return newCookie
}

Partner.fromHeaders = headers => new Promise( (resolve, reject) => {
  const cookieStr = headers ? (headers.Cookie || '') : ''
  const cookies = cookie.parse(cookieStr)
  if(!cookies[cookieKey]) return reject()

  const token = cookies[cookieKey].replace(cookiePrefix, '')
  return jwt.verify(token, secret, (err, decoded) => err ? reject()
    : Partner.findById(decoded.id).then(partner => resolve(partner)) )
})


module.exports = Partner
