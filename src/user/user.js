const S = require('sequelize')
const Op = S.Op
const sequelize = require('../config/sequelize')
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const saltRounds = 10
const jwt = require('jsonwebtoken')
const secret = 'livleusersecret'

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
  current_subscription_id: S.INTEGER,
  next_subscription_id: S.INTEGER,

  suspended_by: S.DATE,
}, { deletedAt: 'deleted_at', paranoid: true,
  createdAt: 'created_at', updatedAt: 'updated_at',
})

User.prototype.getToken = function() { // Arrow function cannot access 'this'
  const token = jwt.sign(this.dataValues, secret)
  return token
}

User.prototype.isSubscribing = function() {
  // last_four_digits가 있으면 구독 지속 중인 상태
  return !!this.last_four_digits
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

User.prototype.sessionData = function() {
  let userData = _.pick(this.dataValues, ['email', 'nickname'])
  userData.token = this.getToken()
  return userData
}

User.signUp = (email, password, nickname) => new Promise((resolve, reject) =>
  bcrypt.hash(password, saltRounds, (err, hash) => err ? reject(err)
    : User.create({
      email: email,
      password: hash,
      nickname: nickname,
    }).then((user) => {
      return resolve(user.sessionData())
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
        return resolve(user.sessionData())
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

const Subscription = require('../subscription')
Subscription.belongsTo(User, {
  foreignKey: { name: 'user_id', allowNull: false },
})
User.hasMany(Subscription, {
  foreignKey: { name: 'user_id', allowNull: false },
})

User.prototype.subscriptionFor = function(date) {
  return new Promise((resolve, reject) =>
    this.getSubscriptions({
      where: { from: { [Op.lte]: date }, to: { [Op.gte]: date } },
    }).then((subscriptions) => {
      if (subscriptions.length > 1) {
        console.error(`User ${this.id}: subscriptions overlapping`)
      }
      if (subscriptions.length === 0) return resolve()
      return resolve(subscriptions[0])
    }).catch((err) => reject(err))
  )
}

const Reservation = require('../reservation/reservation')
User.prototype.getReservations = function(options) {
  options = options || { }
  options.include = [
    {
      model: Subscription,
      attributes: [],
      where: {
        user_id: this.id,
      },
    },
  ]
  return Reservation.findAll(options)
}

User.prototype.getActiveSubscriptions = function() {
  return Subscription.findAll({
    where: {
      id: [this.current_subscription_id, this.next_subscription_id]
    },
    order: [ ['id', 'asc'] ],
  })
}

module.exports = User
