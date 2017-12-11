'use strict'

const User = require('../user/user')
const Subscription = require('./subscription')
const iamport = require('../config/iamport')
const doPay = require('./pay')

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
      user.getSubscription()
      .then((sub) => {
        if (sub) {
          return respond(405, '이미 구독 중입니다.')
        }
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
