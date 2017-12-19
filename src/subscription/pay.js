'use strict'

const iamport = require('../config/iamport')

const PRICE = 100 // TODO change

const nDaysLater = require('./n-days-later')

module.exports = (subscription) =>
  new Promise( (resolve, reject) =>
    iamport.subscribe.again({
      customer_uid: subscription.id,
      merchant_uid: 'livle_subscription' + new Date().getTime(),
      amount: PRICE,
      name: '라이블 정기구독권 결제',
    }).then((res) =>
      // 결제일 현재가 1월 1일이라면 2월 1일 23시 59분 59초까지 유효
      subscription.update({ valid_by: nDaysLater(31) })
      .then((res) => resolve(res))
      .catch((err) =>
        reject(new Error('결제 내용을 업데이트 하는 도중 오류가 발생했습니다. 관리자에게 문의하세요.'))
      )
    ).catch((err) => reject(err))
  )

