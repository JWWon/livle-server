const S = require('sequelize')
const sequelize = require('../config/sequelize')
const bcrypt = require('bcryptjs')
const saltRounds = 10
const jwt = require('jsonwebtoken')
const secret = 'livleusersecret'

const User = sequelize.define('user', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  email: { type: S.STRING(32), unique: true, allowNull: false },
  nickname: S.STRING,
  password: { type: S.STRING, allowNull: false },
  expire_at: S.DATE,
  password_reset_token: S.STRING,
  free_trial_started: S.DATE,
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
  if (!token) return null
  try {
    const user = jwt.verify(token, secret)
    return user.id
  } catch (e) {
    return null
  }
}

User.REJECTIONS = {
  WRONG_PASSWORD: 'wrong_password',
  SUBSCRIBING: 'subscribing',
  NOT_FOUND: 'not_found',
  NO_VALID_SUBSCRIPTION: 'no_valid_subscription',
  SUSPENDED: 'suspended',
}

User.signUp = (email, password, nickname) => new Promise((resolve, reject) =>
  bcrypt.hash(password, saltRounds, (err, hash) => err ? reject(err)
    : User.create({
      email: email,
      password: hash,
      nickname: nickname,
    }).then((user) => {
      let userData = user.dataValues
      userData.password = undefined
      userData.token = user.getToken()
      return resolve(userData)
    }).catch((err) => reject(err))
  )
)

User.signIn = (email, password) => new Promise((resolve, reject) =>
  User.findOne({
    where: {
      email: email,
    },
  }).then((user) =>
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return reject(err)
      if (res) {
        let userData = user.dataValues
        userData.password = undefined
        userData.token = user.getToken()
        return resolve(userData)
      } else {
        reject(User.REJECTIONS.WRONG_PASSWORD)
      }
    })
  ).catch((err) => reject(User.REJECTIONS.NOT_FOUND))
)

const Subscription = require('../subscription/subscription')
User.hasMany(Subscription, {
  foreignKey: { name: 'user_id', allowNull: false },
})


User.dropOut = (email, password) => new Promise((resolve, reject) =>
  User.findOne({
    where: {
      email: email,
    },
  }).then((user) => !user ? reject(User.REJECTIONS.NOT_FOUND) :
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return reject(err)
      if (res) {
        user.getSubscriptions({
          where: {
            cancelled_at: null,
          }
        }).then((subs) => subs.length > 0 ? reject(User.REJECTIONS.SUBSCRIBING)
            : User.destroy({
              where: {
                email: email,
              },
            }).then(() => resolve())
          ).catch((err) => reject(err))
      } else {
        reject(User.REJECTIONS.WRONG_PASSWORD)
      }
    })
  ).catch((err) => reject(err))
)

User.prototype.reservable = function(startsAt) {
  return new Promise((resolve, reject) =>
    this.getSubscriptions({
      where: {
        [S.Op.or]: [
          { cancelled_at: null },
          {
            valid_by: { [S.Op.gte]: startsAt }
          },
        ]
      },
    }).then((subs) => {
      if (subs.length === 0) {
        return resolve(User.REJECTIONS.NO_VALID_SUBSCRIPTION)
      }
      const sub = subs[0]
      if (sub.suspended_by && sub.suspended_by > new Date()) {
        return resolve(User.REJECTIONS.SUSPENDED)
      }
      return resolve(true)
    }).catch((err) => reject(err))
  )
}

const Reservation = require('../reservation/reservation')
User.hasMany(Reservation, {
  foreignKey: { name: 'user_id', allowNull: false },
})

module.exports = User
