'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')
const nDaysLater = require('./n-days-later')

module.exports = (params, respond) => {
  const data = params.body
  if ( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return respond(400, '결제 정보가 누락되었습니다.')
  }

  const initialPay = (user) => {
    // 1주일 무료체험을 한 적이 없는 경우
    if (!user.free_trial_started_at) {
      return user.update({
        free_trial_started_at: new Date(),
        valid_by: nDaysLater(7),
      })
    }

    // 1주일 무료체험을 한 적이 있는 경우
    if (user.valid_by && user.valid_by > new Date()) {
      // 구독을 취소한 후 유효기간이 만료되기 전에 다시 구독 신청을 한 경우
      return user
    } else {
      return user.pay()
    }
  }

  const token = params.auth
  return User.fromToken(token)
    .then((user) => user.isSubscribing() ? respond(405, '이미 구독 중입니다.')
      : iamport.subscribe_customer.create({ // 빌링 키 발급 프로세스
        customer_uid: user.id,
        card_number: data.cardNumber,
        expiry: data.expiry,
        birth: data.birth,
        pwd_2digit: data.password,
      }).then((payRes) => // 빌링키 발급 성공 - User 모델에 구독 정보 업데이트
        user.update({
          card_name: payRes.card_name,
          last_four_digits: data.cardNumber.slice(-4),
          cancelled_at: null,
        }).then((user) => initialPay(user)
        ).then((user) => respond(200, user)
        ).catch((err) => // 결제 실패 또는 구독 정보 업데이트 실패
          respond(402, err)
        )
      ).catch((err) => respond(403, err)) // 결제 정보 인증 실패
    ).catch((err) => respond(401, '로그인이 필요합니다.'))
}
