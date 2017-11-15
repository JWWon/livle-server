const S = require('sequelize')
const sequelize = require('../config/sequelize')

const jwt = require('jsonwebtoken')
const secret = 'livleusersecret'

const User = sequelize.define('user', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: S.STRING, unique: true, allowNull: false },
  nickname: S.STRING,
  password: { type: S.STRING, allowNull: false },
  expire_at: S.DATE,
  is_subscribing: S.BOOLEAN,
  password_reset_token: S.STRING,
  customer_uid: S.STRING
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
