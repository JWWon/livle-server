'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')

module.exports = (params, respond) => {
  const data = params.body
  if ( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return respond(400, '결제 정보가 누락되었습니다.')
  }

  const token = params.auth
  return User.fromToken(token)
    .then((user) => user.getSubscription().then((sub) => {
      if (!sub) return respond(405, '구독 중이 아닙니다.')
      return iamport.subscribe_customer.create({ // 빌링 키 발급 프로세스
        customer_uid: user.id,
        card_number: data.cardNumber,
        expiry: data.expiry,
        birth: data.birth,
        pwd_2digit: data.password,
      }).then((payRes) => {
        if (!sub.paid_at) {
          return sub.pay().then(() => user.deepUserData())
            .then((userData) => respond(201, userData))
        } else {
          return user.deepUserData()
            .then((userData) => respond(200, userData))
        }
      }).catch((err) => {
        console.error(err)
        respond(403, '카드 검증에 실패했습니다.')
      })
    })
    ).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
