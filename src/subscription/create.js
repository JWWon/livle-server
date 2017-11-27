'use strict'

const User = require('../user/user')
const Subscription = require('./subscription')
const response = require('../response')
const iamport = require('../config/iamport')

const PRICE = 1 // TODO change

const doPay = (subscription) =>
  new Promise( (resolve, reject) =>
    iamport.subscribe.again({
      customer_uid: subscription.id,
      merchant_uid: 'livle_subscription' + new Date().getTime(),
      amount: PRICE,
      name: '라이블 정기구독권 결제',
    }).then((res) =>
      subscription.update({ latest_paid_at: new Date() })
      .then((res) => {
 console.log('updated'); resolve()
})
      .catch((err) =>
        reject(new Error('결제 내용을 업데이트 하는 도중 오류가 발생했습니다. 관리자에게 문의하세요.'))
      )
    ).catch((err) => reject(err))
  )

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const data = event.body && JSON.parse(event.body)
  if( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return callback(new Error('[400] 결제 정보가 누락되었습니다.'))
  }

  const token = event.headers.Authorization
  return User.fromToken(token)
    .then((user) =>
      user.getSubscription()
      .then((sub) => {
        if(sub) {
          return callback(new Error('[405] 이미 구독 중입니다.'))
        }
        // 빌링 키 발급 프로세스
        return Subscription.create({ user_id: user.id })
          .then((subscription) =>{
            return iamport.subscribe_customer.create({
              customer_uid: subscription.id,
              card_number: data.cardNumber,
              expiry: data.expiry,
              birth: data.birth,
              pwd_2digit: data.password,
            }).then((res) => {
              return doPay(subscription)
                .then((res) => callback(null, response(200)))
            }).catch((err) => {
              process.exit(-1)
              subscription.destroy().then((res) => callback(err))
            })
          })
      })
    ).catch((err) => {
 console.error(err); callback(new Error('[401] 로그인이 필요합니다.'))
})
}
