'use strict'

const iamport = require('./config/iamport')
const PRICE = 100 // TODO change

module.exports = {
  create: (userId, paymentInfo) => {
    const p = paymentInfo
    if ( !(p.cardNumber && p.expiry && p.birth && p.password) ) {
      return Promise.reject(new Error('결제 정보 누락'))
    }
    return iamport.subscribe_customer.create({ // 빌링 키 발급 프로세스
      customer_uid: userId,
      card_number: paymentInfo.cardNumber,
      expiry: paymentInfo.expiry,
      birth: paymentInfo.birth,
      pwd_2digit: paymentInfo.password,
    })
  },

  delete: (userId) => {
    return iamport.subscribe_customer.delete({
      customer_uid: userId,
    })
  },

  charge: (userId) => {
    const now = new Date()
    return iamport.subscribe.again({
      customer_uid: userId,
      merchant_uid: 'livle_subscription' + now.getTime(),
      amount: PRICE,
      name: '라이블 정기구독권 결제',
    })
  },

  price: PRICE,
}
