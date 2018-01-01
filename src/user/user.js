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
const sendEmail = require('../send-email')

const User = sequelize.define('user', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  // eslint-disable-next-line new-cap
  email: { type: S.STRING(64), unique: true, allowNull: false },
  nickname: S.STRING,
  password: S.STRING, // 페이스북으로 가입한 유저의 경우 null
  password_reset_token: S.STRING,
  facebook_token: S.STRING, // unique하게 하고 싶은데 index key length 때문에..

  // Subscription
  card_name: S.STRING,
  last_four_digits: S.STRING, // null if not subscribing at the moment
  cancelled_at: S.DATE,

  suspended_by: S.DATE,
}, { createdAt: 'created_at', updatedAt: 'updated_at' })

User.prototype.getToken = function() { // Arrow function cannot access 'this'
  const token = jwt.sign(this.dataValues, secret)
  return token
}

User.prototype.isSubscribing = function() {
  // last_four_digits가 있으면 구독 지속 중인 상태
  return !!this.last_four_digits
}

User.prototype.pay = function() {
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const d = date.getDate()

    const twoDigits = (number) => number < 10 ? '0' + number : number
    return `${year}.${twoDigits(month)}.${twoDigits(d)}`
  }

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
      .then((user) => {
        return sendEmail(this.email, '라이블 결제 성공', 'payment_success',
          { nickname: this.nickname,
            price: PRICE,
            cardName: this.card_name,
            lastFourDigits: this.last_four_digits,
            paidAt: formatDate(this.updated_at),
            nextPaymentDue: formatDate(this.valid_by),
          }).then(() => resolve(user))
          .catch((err) => {
            console.error(err) // 결제되었으나 이메일만 보내지지 않은 경우
            return resolve(user)
          })
      })
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
      : this.update({ password: hash, password_reset_token: null })
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

const FreeTrial = require('../free_trial')
User.hasOne(FreeTrial, {
  foreignKey: { name: 'free_trial_id' },
})

const Subscription = require('../subscription')
Subscription.belongsTo(User, {
  foreignKey: { name: 'user_id' },
})
User.hasOne(Subscription, {
  as: 'currentSubscription',
})
User.hasOne(Subscription, {
  as: 'nextSubscription',
})

User.prototype.subscriptionFor = function(date) {
  return new Promise((resolve, reject) =>
    this.getCurrentSubscription().then((sub) => {
      if (!sub) return resolve()
      if (date < sub.valid_by) return resolve(sub)
      return this.getNextSubscription().then((sub) => {
        if (!sub) return resolve()
        if (date < sub.valid_by) return resolve(sub)
        return resolve()
      })
    }).catch((err) => reject(err))
  )
}

const Reservation = require('../reservation/reservation')
User.hasMany(Reservation, {
  through: User.associations.subscriptions,
})


module.exports = User
