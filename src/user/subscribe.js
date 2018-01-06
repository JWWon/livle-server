'use strict'

const Subscription = require('../subscription')
const FreeTrial = require('../free_trial')
const Billing = require('../billing')
const sendEmail = require('../send-email')

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

const auth = (user, paymentInfo) => {
  const cardNumber = paymentInfo.cardNumber
  const createInitial = (trial) => {
    const now = new Date()
    return new Promise((resolve, reject) =>
      user.getSubscription().then((sub) => {
        if (sub) {
          reject(new Error('이미 구독 중입니다.'))
        } else {
          return Subscription.create({
            user_id: user.id,
            paid_at: trial ? now : null,
            from: startOfDay(now),
            to: thirtyDaysFrom(now),
          })
        }
      }).then((sub) => {
        if (trial) {
          return sub.createNext()
        } else {
          return sub.pay().catch((err) =>
            sub.destroy().then(() =>
              reject(new Error('결제에 실패했습니다.'))
            )
          )
        }
      })
      .then(([curr, next]) => {
        if (trial) {
          const formatDate = (date) => {
            const month = date.getMonth() + 1
            const d = date.getDate()
            return `${month}월 ${d}일`
          }
          sendEmail(user.email, '라이블 멤버십 가입을 환영합니다.',
            'free_trial', { toDate: formatDate(curr.to) })
            .then(() => resolve(user))
            .catch((err) => {
              console.error(err)
              resolve(user)
            })
        }
        resolve(user)
      })
      .catch((err) => reject(err))
    )
  }

  if (!paymentInfo.skipTrial && !user.free_trial_id) {
    // FreeTrial 로그를 남김
    return FreeTrial.log(cardNumber).then((ft) =>
      user.update({ free_trial_id: ft.id })
    ).then((user) => createInitial(true))
  } else {
    // 결제를 요청함
    return createInitial()
  }
}

module.exports = function(paymentInfo) {
  return new Promise((resolve, reject) =>
    this.getSubscription().then((currSub) => {
      if (currSub) reject({ code: 409, err: '이미 구독 중입니다.' })
      Billing.create(this.id, paymentInfo).then((payRes) =>
        // 빌링키 발급 성공 (카드 인증 성공)
        this.update({
          card_name: payRes.card_name,
          last_four_digits: paymentInfo.cardNumber.slice(-4),
        }).then((user) =>
          // 유저 모델에 카드 정보 업데이트 완료
          auth(this, paymentInfo)
          .then(() => resolve(user))
          .catch((err) =>
            // 결제 실패 (ex. 잔액 부족, 한도 초과...)
            Billing.delete(this.id).then(() =>
              this.update({ card_name: null, last_four_digits: null })
            ).then(() => {
              console.log(err)
              reject({ code: 402, err: '결제에 실패했습니다.' })
            }).catch((err) => {
              console.error(err)
              reject({ code: 402, err: '결제에 실패했습니다.' })
            })
          )
        )
      ).catch((err) => {
        // 빌링키 발급 실패 (카드 인증 실패 ex. 비밀번호 오류)
        reject({ code: 403, err: err })
      })
    })
  )
}
