'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')
const FreeTrial = require('../free_trial')
const Subscription = require('../subscription')

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

module.exports = (params, respond) => {
  const data = params.body
  if ( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return respond(400, '결제 정보가 누락되었습니다.')
  }

  const now = new Date()

  const initialPay = (user) => {
    const fromDate = startOfDay(now)

    // 1주일 무료체험을 한 적이 없는 경우
    if (!user.free_trial_id) {
      return FreeTrial.log(data.cardNumber)
        .then((ft) =>
          user.update({
            free_trial_id: ft.id,
            cancelled_at: null,
          })
        ).then((user) => {
          return Subscription.create({
            user_id: user.id,
            from: fromDate,
            to: nDaysFrom(6, now),
          })
        }).then((newSub) =>
          newSub.approvePayment(user, now)
        )
    }

    // 1주일 무료체험을 한 적이 있는 경우
    return user.getCurrentSubscription()
      .then((currSub) => {
        if (currSub) {
          // 구독을 취소한 후 유효기간이 만료되기 전에 다시 구독 신청을 한 경우
          if (!user.cancelled_at) {
            return Promise.reject(new Error('취소한 적이 없는데 이어지는 구독이 없습니다.'))
          }
          return currSub.createNext().then((user) => {
            user.update({ cancelled_at: null })
          })
        } else {
          // 신규 구독
          return Subscription.create({
            user_id: user.id,
            from: fromDate,
            to: nDaysFrom(30, now),
          }).then((newSub) => newSub.pay())
      }
    })
  }

  const token = params.auth
  return User.fromToken(token)
    .then((user) => {
      if (user.isSubscribing()) return respond(405, '이미 구독 중입니다.')
      if (!user.free_trial_id) {
        return new Promise((resolve, reject) =>
          FreeTrial.check(data.cardNumber)
          .then((available) => {
            if (!available) return respond(406, '이미 체험한 카드입니다.')
            return resolve(user)
          })
        )
      }
      return user
    }).then((user) =>
      iamport.subscribe_customer.create({ // 빌링 키 발급 프로세스
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
        ).then((subscriptions) => {
          let userData = user.dataValues
          userData.currentSubscription = subscriptions[0].dataValues
          userData.currentSubscription.used = 0
          userData.nextSubscription = subscriptions[1].dataValues
          userData.nextSubscription.used = 0
          return respond(200, userData)
        }).catch((err) => { // 결제 실패 또는 구독 정보 업데이트 실패
          console.error(err)
          respond(402, err)
        })
      ).catch((err) => respond(403, err)) // 결제 정보 인증 실패
    ).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
