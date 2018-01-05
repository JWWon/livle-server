'use strict'

const _ = require('lodash')
const Op = require('sequelize').Op
const Subscription = require('.')
const Reservation = require('../reservation/reservation')

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

const renew = (subscription) => new Promise((resolve, reject) =>
  subscription.pay().then((subs) => {
    log(subs)
    return resolve()
  }).catch((err) => {
    if (subscription.from > yesterday()) {
      console.error(`User ${subscription.user_id} : 재구독 실패 (첫 번째)`)
      // TODO push notification
      // TODO send failure mail
    } else {
      console.error(`User ${subscription.user_id} : 재구독 실패`)
      Reservation.destroy({
        where: { subscription_id: subscription.id },
      }).then((cancelledCount) => {
        if (cancelledCount > 0) {
          console.error(`User ${subscription.user_id} : 재구독 두번째 실패로 예약 취소`)
        }
        // TODO push notification
        // TODO send failure mail
      })
    }
  })
)

module.exports = (params, respond) =>
  Subscription.findAll({
    where: {
      // 결제되지 않은 모델 중 시작 기간이 오늘 혹은 그 이전인 것들
      paid_at: null,
      from: { [Op.lte]: startOfToday() },
    },
  }).then((subscriptions) => {
    const renewal = _.map(subscriptions, (s) => renew(s))
    return Promise.all(renewal)
  }).then(() => respond(200))
    .catch((err) => console.error(err))
