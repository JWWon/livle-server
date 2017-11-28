'use strict'

const User = require('../user/user')
const Subscription = require('./subscription')
const iamport = require('../config/iamport')

const PRICE = 100 // TODO change

const doPay = (subscription) =>
  new Promise( (resolve, reject) =>
    iamport.subscribe.again({
      customer_uid: subscription.id,
      merchant_uid: 'livle_subscription' + new Date().getTime(),
      amount: PRICE,
      name: '라이블 정기구독권 결제',
    }).then((res) =>
      subscription.update({ latest_paid_at: new Date() })
      .then((res) => resolve())
      .catch((err) =>
        reject(new Error('결제 내용을 업데이트 하는 도중 오류가 발생했습니다. 관리자에게 문의하세요.'))
      )
    ).catch((err) => reject(err))
  )

module.exports = (params, respond) => {
  const data = params.body
  if( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return respond(400, '결제 정보가 누락되었습니다.')
  }

  const token = params.auth
  return User.fromToken(token)
    .then((user) =>
      user.getSubscription()
      .then((sub) => {
        if(sub) {
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
          }).then((res) => {
            return doPay(subscription)
              .then((res) => respond(200))
          }).catch((err) =>
            subscription.destroy().then((res) => respond(500, err))
          )
        )
      })
    ).catch((err) => respond(401, '로그인이 필요합니다.'))
}
