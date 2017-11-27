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
  password_reset_token: S.STRING,
},
  { timestamps: false }
)

User.prototype.getToken = function() { // Arrow function cannot access 'this'
  const token = jwt.sign(this.dataValues, secret)
  return token
}

User.fromToken = (token) =>
  new Promise( (resolve, reject) => !token ? reject() :
    jwt.verify(token, secret,
      (err, decoded) => err ? reject(err) :
      User.findById(decoded.id)
      .then((user) => user ? resolve(user) : reject(new Error('Not found')))
    )
)

User.checkSession = (event) => {
  const token = event.headers.Authorization
  if(!token) return null
  try{
    const user = jwt.verify(token, secret)
    return user.id
  } catch(e) {
    return null
  }
}

const Subscription = require('../subscription/subscription')
User.hasMany(Subscription, {
  foreignKey: { name: 'user_id', allowNull: false },
})

User.prototype.getSubscription = function() {
  return new Promise((resolve, reject) =>
    this.getSubscriptions().then((items) => {
      if(items.length == 0) {
        return resolve(null)
      } else if(items.length == 1) {
        return resolve(items[0])
      } else{
        reject(new Error('Two or more subscriptions record'))
      }
    }).catch((err) => reject(err))
  )
}

module.exports = User
