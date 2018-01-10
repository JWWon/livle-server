const S = require('sequelize')
const Op = S.Op
const sequelize = require('../config/sequelize')
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const saltRounds = 10
const jwt = require('jsonwebtoken')
const secret = 'livleusersecret'
const FreeTrial = require('../free_trial')
const sendEmail = require('../send-email')
const uuid = require('uuid/v1')

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
  subscription_id: S.INTEGER,

  free_trial_id: S.INTEGER,
  suspended_by: S.DATE,
}, { deletedAt: 'deleted_at', paranoid: true,
  createdAt: 'created_at', updatedAt: 'updated_at',
})

User.prototype.getToken = function() { // Arrow function cannot access 'this'
  const userData = _.pick(this.dataValues,
    ['id', 'email', 'password', 'facebook_token'])
  const token = jwt.sign(userData, secret)
  return token
}

User.fromToken = (token) => {
  return new Promise( (resolve, reject) => !token ? reject() :
    jwt.verify(token, secret,
      (err, decoded) => err ? reject(err) :
      User.findById(decoded.id)
      .then((user) => user ? resolve(user) : reject(new Error('Not found')))
    )
  )
}

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

const pick = (data) => _.pick(data, [
  'email', 'nickname', 'cardName', 'lastFourDigits',
  'suspendedBy', 'freeTrial', 'currentSubscription', 'nextSubscription',
])
const subscriptionPick = (data) => _.reduce(data, (result, value, key) => {
  switch (key) {
    case 'paid_at':
      result.paidAt = value
      break
    case 'from':
    case 'to':
    case 'used':
      result[key] = value
      break
    default:
      break
  }
  return result
}, {})

User.prototype.userData = function() {
  return pick(this.dataValues)
}

User.prototype.deepUserData = function() {
  return new Promise((resolve, reject) =>
    this.reload({
      attributes: [
        'email',
        'nickname',
        ['card_name', 'cardName'],
        ['last_four_digits', 'lastFourDigits'],
        ['suspended_by', 'suspendedBy'],
        'free_trial_id',
        'subscription_id',
      ],
    }).then(() => {
      let userData = this.dataValues
      FreeTrial.findOne({
        where: { id: this.free_trial_id },
        attributes: [['created_at', 'createdAt']],
      }).then((ft) => {
        if (ft) {
          userData.freeTrial = ft.dataValues
        }
        this.getSubscription()
          .then((currSub) => {
            if (!currSub) return resolve(pick(userData))
            currSub.getUsedCount().then((used) => {
              let s = currSub.dataValues
              s.used = used
              userData.currentSubscription = subscriptionPick(s)
            }).then(() => currSub.getNext())
              .then((nextSub) => {
                if (!nextSub) return resolve(pick(userData))
                nextSub.getUsedCount().then((used) => {
                  let s = nextSub.dataValues
                  s.used = used
                  userData.nextSubscription = subscriptionPick(s)
                  resolve(pick(userData))
                })
              })
          })
      })
    })
  )
}

User.signUp = (email, password, nickname) => new Promise((resolve, reject) =>
  bcrypt.hash(password, saltRounds, (err, hash) => err ? reject(err)
    : User.create({
      email: email,
      password: hash,
      nickname: nickname,
    }).then((user) => {
      sendEmail(user.email, '라이블 가입을 환영합니다.', 'welcome', {})
        .then((sent) => resolve(user.sessionData()))
        .catch((err) => {
          console.error(err)
          resolve(user.sessionData())
        })
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
        user.getSubscription().then((sub) => {
          if (sub) {
            return reject(User.REJECTIONS.SUBSCRIBING)
          } else {
            return user.update({
              email: `${user.email}#${uuid()}`,
            }).then((user) => user.destroy())
              .then(() => resolve())
          }
        })
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
  return new Promise((resolve, reject) => {
    const now = new Date()
    if (this.suspended_by && this.suspended_by < now) {
      return resolve()
    }
    this.getSubscriptions({
      where: { from: { [Op.lte]: date }, to: { [Op.gte]: date } },
    }).then((subscriptions) => {
      if (subscriptions.length > 1) {
        console.error(`User ${this.id}: subscriptions overlapping`)
      }
      if (subscriptions.length === 0) return resolve()
      const s = subscriptions[0]
      if (!s.paid_at) {
        // 결제가 아직 안 된 구독인 경우
        const now = new Date()
        const unpaidHours = ( now - s.from ) / 1000 / 60 / 60
        // 24시간 이상 결제가 안 되고 있는 경우 Invalid
        if (unpaidHours > 24) {
          return resolve()
        }
      }
      return resolve(s)
    }).catch((err) => reject(err))
  })
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

User.prototype.getSubscription = function(options) {
  options = options || { }
  options.where = options.where || { }
  options.where = { id: this.subscription_id }
  return Subscription.findOne(options)
}

User.prototype.subscribe = require('./subscribe')
User.prototype.unsubscribe = require('./unsubscribe')

module.exports = User
