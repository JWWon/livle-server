const S = require('sequelize')
const sequelize = require('../config/sequelize')

const jwt = require('jsonwebtoken')
const secret = 'livlesecret'

const User = sequelize.define('user', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: S.STRING, unique: true },
  nickname: S.STRING,
  password: S.STRING,
  expire_at: S.DATE,
  is_subscribing: S.BOOLEAN
},
  { timestamps: false }
)

User.prototype.getToken = function() { // Arrow function cannot access 'this'
  const token = jwt.sign(this.dataValues, secret)
  return token
}

User.fromToken = token => new Promise( (resolve, reject) => !token ? reject() :
  jwt.verify(token, secret, (err, decoded) => User.findById(decoded.id)
    .then(user => resolve(user) ))
)

module.exports = User
