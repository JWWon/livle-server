'use strict'

const User = require('../user/user')
const Subscription = require('./subscription')
const iamport = require('../config/iamport')
const doPay = require('./pay')
const nDaysLater = require('./n-days-later')

module.exports = (params, respond) => {
  const data = params.body
  if ( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return respond(400, '결제 정보가 누락되었습니다.')
  }

  const token = params.auth
  return User.fromToken(token)
    .then((user) =>
      user.getSubscriptions({
        where: {
          cancelled_at: null,
        },
      }).then((subs) => {
        if (subs.length > 0) {
          return respond(405, '이미 구독 중입니다.')
        }
        // TODO : 취소되었지만 유효기간이 있는 구독이 있을 때
        // 빌링 키 발급 프로세스
        return Subscription.create({
          user_id: user.id,
          last_four_digits: data.cardNumber.slice(-4),
        }).then((subscription) =>
          iamport.subscribe_customer.create({
            customer_uid: subscription.id,
            card_number: data.cardNumber,
            expiry: data.expiry,
            birth: data.birth,
            pwd_2digit: data.password,
          }).then((payRes) => {
            // 1주일 무료체험을 한 적이 없는 경우
            if (!user.free_trial_started) {
              return user.update({ free_trial_started: new Date() })
                .then((user) => subscription.update({ valid_by: nDaysLater(7) })
                ).then((subRes) => respond(200, {
                  card_name: payRes.card_name,
                  latest_paid_at: subRes.latest_paid_at,
                  last_four_digits: subRes.last_four_digits,
                }))
            }

            // 1주일 무료체험을 한 적이 있는 경우
            return doPay(subscription)
              .then((subRes) => respond(200, {
                card_name: payRes.card_name,
                latest_paid_at: subRes.latest_paid_at,
                last_four_digits: subRes.last_four_digits,
              }))
          }).catch((err) =>
            subscription.destroy().then((res) => respond(500, err))
          )
        )
      })
    ).catch((err) => respond(401, '로그인이 필요합니다.'))
}
