const S = require('sequelize')
const sequelize = require('../config/sequelize')
const Billing = require('../billing')
const sendEmail = require('../send-email')

const Subscription = sequelize.define('subscription', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  paid_at: S.DATE,
  // 이 구독이 커버하는 기간
  from: { type: S.DATE, allowNull: false }, // n월 n일 00:00:00
  to: { type: S.DATE, allowNull: false }, // n월 n+30일 23:59:59
  expired: { type: S.BOOLEAN, defaultValue: false },
  limit: { type: S.INTEGER, defaultValue: 2 },
}, {
  deletedAt: 'cancelled_at', paranoid: true,
  createdAt: 'created_at', updatedAt: 'updated_at',
})

Subscription.hasOne(Subscription, {
  as: 'Next', foreignKey: 'next_subscription_id',
})

const sendPaymentEmail = (user, paidAt, nextPaymentDue) => {
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const d = date.getDate()

    const twoDigits = (number) => number < 10 ? '0' + number : number
    return `${year}.${twoDigits(month)}.${twoDigits(d)}`
  }

  return sendEmail(user.email,
    '라이블 멤버십 이용권 자동 결제가 성공했습니다.', 'payment_success',
    { nickname: user.nickname || '라이블 유저',
      price: Billing.price,
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
  if (!this.paid_at) {
    return Promise.reject(new Error('결제 후에 연장이 가능합니다.'))
  }

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
    this.getNext().then((nextSub) => {
      if (nextSub) reject(new Error('이미 다음 구독이 있습니다.'))
      return Subscription.create({
        user_id: this.user_id,
        from: nextFromDate,
        to: nextToDate,
      })
    }).then((nextSub) =>
      this.update({ next_subscription_id: nextSub.id })
      .then(() => this.getUser())
      .then((user) => user.update({ subscription_id: this.id }))
      .then((user) => resolve([this, nextSub]))
    ).catch((err) => reject(err))
  )
}

const startOfDay = (d) => {
  let date = new Date(d)
  date.setHours(0, 0, 0)
  return date
}

const thirtyDaysFrom = (from) => {
  let date = new Date(from)
  date.setDate(date.getDate() + 30)
  date.setHours(23, 59, 59)
  return date
}

Subscription.prototype.pay = function() {
  const now = new Date()

  return new Promise((resolve, reject) => {
    if (this.paid_at) reject('이미 결제된 구독입니다.')
    if (now < this.from) reject('아직 결제할 시기가 아닙니다.')

    const fromDate = startOfDay(now)
    const toDate = thirtyDaysFrom(now)

    this.getUser().then((user) =>
      Billing.charge(user.id).then((res) =>
        this.update({
          paid_at: now,
          from: fromDate,
          to: toDate,
        }).then((sub) =>
          sub.createNext().then(([curr, next]) =>
            sendPaymentEmail(user, now, next.from)
            .then((sent) => resolve([curr, next]))
          ).catch((err) => {
            // 현재 구독 모델을 업데이트했으나
            // 구독을 연장하거나 메일을 보내는 데 실패함
            console.error(err)
            resolve(sub)
          })
        ).catch((err) => {
          // fatal case
          // 결제는 되었으나 결제 정보를 업데이트하는데 실패함
          console.error(err)
          reject(err)
        })
      ).catch((err) => reject(new Error('결제 실패')))
    )
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

Subscription.prototype.getNext = function(options) {
  options = options || { }
  options.where = options.where || { }
  options.where = { id: this.next_subscription_id }
  return Subscription.findOne(options)
}

module.exports = Subscription
