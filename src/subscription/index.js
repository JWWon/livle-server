const S = require('sequelize')
const sequelize = require('../config/sequelize')
const iamport = require('../config/iamport')
const PRICE = 100 // TODO change
const sendEmail = require('../send-email')

const Subscription = sequelize.define('subscription', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  paid_at: S.DATE,
  // 이 구독이 커버하는 기간
  from: { type: S.DATE, allowNull: false }, // n월 n일 00:00:00
  to: { type: S.DATE, allowNull: false }, // n월 n+30일 23:59:59
}, {
  deletedAt: 'cancelled_at', paranoid: true,
  createdAt: 'created_at', updatedAt: 'updated_at',
})

const sendPaymentEmail = (user, paidAt, nextPaymentDue) => {
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const d = date.getDate()

    const twoDigits = (number) => number < 10 ? '0' + number : number
    return `${year}.${twoDigits(month)}.${twoDigits(d)}`
  }

  return sendEmail(user.email, '라이블 결제 성공', 'payment_success',
    { nickname: user.nickname,
      price: PRICE,
      cardName: user.card_name,
      lastFourDigits: user.last_four_digits,
      paidAt: formatDate(paidAt),
      nextPaymentDue: formatDate(nextPaymentDue),
    }).then(() => Promise.resolve(true))
    .catch((err) => {
      console.error(err)
      return Promise.resolve(false)
    })
}

Subscription.prototype.createNext = function() {
  const getNextFromDate = (currTo) => {
    let date = new Date(currTo)
    date.setDate(date.getDate() + 1)
    date.setHours(0, 0, 0)
    return date
  }

  const getToDate = (fromDate) => {
    let date = new Date(fromDate)
    date.setHours(23, 59, 59)
    date.setDate(date.getDate() + 30)
    return date
  }

  const nextFromDate = getNextFromDate(this.to)
  const nextToDate = getToDate(nextFromDate)

  return new Promise((resolve, reject) =>
    Subscription.create({
      user_id: this.user_id,
      from: nextFromDate,
      to: nextToDate,
    }).then((newSub) => resolve([this, newSub]))
    .catch((err) => reject(err))
  )
}

Subscription.prototype.approvePayment = function(user, at) {
  const now = at

  return new Promise((resolve, reject) =>
    this.update({ paid_at: now })
    .then((updatedSub) => updatedSub.createNext()
    ).then(([currSub, nextSub]) => {
      return user.update({
        current_subscription_id: currSub.id,
        next_subscription_id: nextSub.id,
      }).then((user) => sendPaymentEmail(user, now, nextSub.from))
        .then((sent) => resolve([currSub, nextSub]))
    }).catch((err) => {
      console.error(`User ${user.id}: 결제되었으나 정상적으로 업데이트되지 않음`)
      console.error(err)
      return reject(err)
    })
  )
}

Subscription.prototype.pay = function() {
  const now = new Date()

  if (this.paid_at) return Promise.reject('이미 결제된 구독입니다.')
  if (now < this.from) return Promise.reject('아직 결제할 시기가 아닙니다.')

  return this.getUser().then((user) => {
    if (user.cancelled_at) {
      console.error(`User ${user.id}: 구독을 취소하였으나 재결제 시도됨`)
      return Promise.reject('구독을 취소한 유저입니다.')
    }

    return iamport.subscribe.again({
      customer_uid: user.id,
      merchant_uid: 'livle_subscription' + now.getTime(),
      amount: PRICE,
      name: '라이블 정기구독권 결제',
    }).then((res) => this.approvePayment(user, now)
    ).catch((err) => Promise.reject(err))
  })
}

const Reservation = require('../reservation/reservation')
Reservation.belongsTo(Subscription, {
  foreignKey: { name: 'subscription_id', allowNull: false },
})
Subscription.hasMany(Reservation, {
  foreignKey: { name: 'subscription_id', allowNull: false },
})
Subscription.prototype.cancel = function() {
  return new Promise((resolve, reject) => {
    if (this.paid_at) {
      return reject(new Error('이미 결제된 구독을 취소할 수 없습니다.'))
    }
    return Reservation.destroy({
      where: { subscription_id: this.id },
    }).then((count) => this.destroy())
      .then((count) => resolve())
      .catch((err) => reject(err))
  })
}

Subscription.prototype.getUsedCount = function() {
  return Reservation.count({
    where: { subscription_id: this.id },
  })
}

module.exports = Subscription
