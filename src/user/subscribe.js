'use strict'

const iamport = require('../config/iamport')
const Subscription = require('../subscription')
const FreeTrial = require('../free_trial')

const startOfDay = (d) => {
  let date = new Date(d)
  date.setHours(0, 0, 0)
  return date
}

const nDaysFrom = (n, from) => {
  let date = new Date(from)
  date.setDate(date.getDate() + n)
  date.setHours(23, 59, 59)
  return date
}

const startTrial = (user, cardNumber) => {
  const now = new Date()
  return FreeTrial.log(cardNumber)
    .then((ft) =>
      user.update({
        free_trial_id: ft.id,
        cancelled_at: null,
      })
    ).then((user) => {
      return Subscription.create({
        user_id: user.id,
        from: startOfDay(now),
        to: nDaysFrom(6, now),
      })
    }).then((newSub) =>
      newSub.approvePayment(user, now)
    )
}

const startSubscription = (user) => {
  const now = new Date()
  return user.getActiveSubscriptions()
    .then(([currSub, nextSub]) => {
      if (currSub) {
        // 구독을 취소한 후 유효기간이 만료되기 전에 다시 구독 신청을 한 경우
        if (nextSub) {
          return Promise.reject(new Error('취소했는데 이어지는 구독이 있습니다.'))
        }
        return currSub.createNext().then(([curr, next]) =>
          user.update({
            cancelled_at: null,
            next_subscription_id: next.id,
          }).then(() => [curr, next])
        )
      } else {
        // 신규 구독
        return Subscription.create({
          user_id: user.id,
          from: startOfDay(now),
          to: nDaysFrom(30, now),
        }).then((newSub) => newSub.pay())
      }
    })
}

module.exports = function(paymentInfo) {
  return new Promise((resolve, reject) =>
    iamport.subscribe_customer.create({ // 빌링 키 발급 프로세스
      customer_uid: this.id,
      card_number: paymentInfo.cardNumber,
      expiry: paymentInfo.expiry,
      birth: paymentInfo.birth,
      pwd_2digit: paymentInfo.password,
    }).then((payRes) => // 빌링키 발급 성공 - User 모델에 구독 정보 업데이트
      this.update({
        card_name: payRes.card_name,
        last_four_digits: paymentInfo.cardNumber.slice(-4),
        cancelled_at: null,
      }).then((user) => {
        if (!user.free_trial_id) {
          // 1주일 무료체험을 한 적이 없는 경우
          return startTrial(user, paymentInfo.cardNumber)
        } else {
          return startSubscription(user)
        }
      })
      .then((subs) => resolve(subs))
      // resolving value: [currentSubscription, nextSubscription]
      .catch((err) => {
        console.error(err)
        reject({ code: 402, err: err })
      })
    ).catch((err) => reject({ code: 403, err: err }))
  )
}
