const S = require('sequelize')
const sequelize = require('../config/sequelize')
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const saltRounds = 10
const jwt = require('jsonwebtoken')
const secret = 'livleusersecret'

const iamport = require('../config/iamport')
const PRICE = 100 // TODO change
const nDaysLater = require('../subscription/n-days-later')

const User = sequelize.define('user', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  email: { type: S.STRING(32), unique: true, allowNull: false },
  nickname: S.STRING,
  password: { type: S.STRING, allowNull: false },
  password_reset_token: S.STRING,

  // Subscription
  card_name: S.STRING,
  last_four_digits: S.STRING, // null if not subscribing at the moment
  cancelled_at: S.DATE,

  valid_by: S.DATE,
  suspended_by: S.DATE,
  free_trial_started_at: S.DATE,
}, { createdAt: 'created_at', updatedAt: 'updated_at' })

User.prototype.getToken = function() { // Arrow function cannot access 'this'
  const token = jwt.sign(this.dataValues, secret)
  return token
}

User.prototype.isSubscribing = function() {
  // last_four_digits가 있으면 구독 지속 중인 상태
  return !!this.last_four_digits
}

User.prototype.reservable = function(startsAt) {
  return startsAt < this.valid_by ||
    (this.isSubscribing() && (new Date() <= this.valid_by))
}

User.prototype.pay = function() {
  return new Promise( (resolve, reject) => {
    if (this.valid_by > new Date()) {
      return reject('아직 유효한 구독입니다.')
    }
    return iamport.subscribe.again({
      customer_uid: this.id,
      merchant_uid: 'livle_subscription' + new Date().getTime(),
      amount: PRICE,
      name: '라이블 정기구독권 결제',
    }).then((res) =>
      // 결제일 현재가 1월 1일이라면 2월 1일 23시 59분 59초까지 유효
      this.update({ valid_by: nDaysLater(31) })
      .then((user) => resolve(user))
    ).catch((err) => reject(err))
  })
}

User.prototype.cancelReservationsAfter = function(date) {
  return new Promise((resolve, reject) =>
    this.getReservations().then((reservations) => {
      const rActions =
        _.map(reservations, (r) => new Promise((resolve, reject) =>
          r.getTicket().then((ticket) => {
            if (ticket.start_at > date) {
              r.destroy().then(() => resolve())
            } else {
              resolve()
            }
          })
        ))
      return Promise.all(rActions)
    }).then(() => resolve()).catch((err) => reject(err))
  )
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

User.prototype.updatePassword = function(password) {
  return new Promise((resolve, reject) =>
    bcrypt.hash(password, saltRounds, (err, hash) => err ? reject(err)
      : this.update({ password: hash })
      .then((user) => resolve())
      .catch((err) => reject(err))
    )
  )
}

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

User.dropOut = (email, password) => new Promise((resolve, reject) =>
  User.findOne({
    where: {
      email: email,
    },
  }).then((user) => !user ? reject(User.REJECTIONS.NOT_FOUND) :
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return reject(err)
      if (res) {
        if (user.isSubscribing()) {
          return reject(User.REJECTIONS.SUBSCRIBING)
        }
        return User.destroy({
          where: {
            email: email,
          },
        }).then(() => resolve())
      } else {
        return reject(User.REJECTIONS.WRONG_PASSWORD)
      }
    })
  ).catch((err) => reject(err))
)

const Reservation = require('../reservation/reservation')
User.hasMany(Reservation, {
  foreignKey: { name: 'user_id', allowNull: false },
})

module.exports = User
