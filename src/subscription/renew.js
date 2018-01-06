'use strict'

const _ = require('lodash')
const Op = require('sequelize').Op
const Subscription = require('.')
const Reservation = require('../reservation/reservation')
const Billing = require('../billing')
const sendEmail = require('../send-email')

const startOfToday = () => {
  let date = new Date()
  date.setHours(0, 0, 0)
  return date
}

const yesterday = () => {
  let date = startOfToday()
  date.setHours(0, 0, -1)
  return date
}

const log = (subs) => {
  const curr = subs[0]
  const next = subs[1]
  console.log(`User ${curr.user_id} : 재구독 성공 \
  (${curr.id} 결제된 구독 / ${next.id} 다음구독)`)
}

const sendFailureEmail = (subscription) => new Promise((resolve, reject) =>
  subscription.getUser().then((user) =>
    sendEmail(user.email, '라이블 구독 갱신 실패', 'payment_failure', { })
    .then(() => resolve(user))
    .catch((err) => reject(err))
  )
)

const renew = (subscription) => new Promise((resolve, reject) => {
  subscription.getNext().then((next) => {
    if (!next) {
      // 갱신할 구독이 없음 : 빌링 키 삭제
      subscription.getUser((user) => {
        Billing.delete(user.id).then(() =>
          user.update({ card_name: null, last_four_digits: null }))
          .then(() => resolve())
      }).catch((err) => reject(err))
    } else {
      next.pay().then((subs) => {
        log(subs)
        return resolve()
      }).catch((err) => {
        if (subscription.from > yesterday()) {
          console.error(`User ${subscription.user_id} : 재구독 실패 (첫 번째)`)
          // TODO push notification
          sendFailureEmail(subscription).then(() => reject(err))
            .catch((err) => reject(err))
        } else {
          console.error(`User ${subscription.user_id} : 재구독 실패`)
          Reservation.destroy({
            where: { subscription_id: subscription.id },
          }).then((cancelledCount) => {
            if (cancelledCount > 0) {
              console.error(`User ${subscription.user_id} : 재구독 두번째 실패로 예약 취소`)
            }
            // TODO push notification
            sendFailureEmail(subscription).then(() => reject(err))
              .catch((err) => reject(err))
          }).catch((err) => reject(err))
        }
      })
    }
  })
})

module.exports = (params, respond) => {
  const now = new Date()
  return Subscription.findAll({
    where: {
      // 만료된 구독을 찾음
      expired: false,
      to: { [Op.lte]: now },
    },
  }).then((subscriptions) => {
    const renewal = _.map(subscriptions, (s) => renew(s)
      .then((s) => s.update({ expired: true }))
    )
    return Promise.all(renewal)
  }).then(() => {
    console.log('Successful renewal')
    respond(200)
  }).catch((err) => {
    console.error('Problem occurred during renewal')
    console.error(err)
  })
}
