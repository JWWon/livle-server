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

User.prototype.getToken = () => {
  const token = jwt.sign(this, secret)
  return token
}

User.currentUser = (headers, context) => {
  if (headers) {
    const token = headers.Authorization
    if(token) {
      try {
        const user = jwt.verify(token, secret)
        // TODO : sequelize 오브젝트로 인식되려나
        return user
      } catch(err) {
        return null // Errorneous token
      }
    }
  }
  return null
}

module.exports = User
