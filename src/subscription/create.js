'use strict'

const User = require('../user/user')
const response = require('../response')
const iamport = require('../config/iamport')

const PRICE = 8900 // Example

const cancelPayment = (imp_uid, errorText, callback) =>
  iamport.payment.cancel({ imp_uid: imp_uid, reason: errorText })
    .then(() => callback(new Error(errorText + " : 결제가 취소되었습니다.")))
    .catch(() => {
      // Fatal error - 취소 실패
      return callback(new Error(errorText + " : 결제를 취소하는 데 실패했습니다."))
    })

const authorizePayment = (user, imp_uid) =>
  new Promise( (resolve, reject) => {
    // TODO : 구독 정보 데이터베이스에 추가 implement
    resolve()
  })

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const data = event.body && JSON.parse(event.body)
  if(!data || !data.imp_uid) return callback(new Error("[400] 결제 아이디가 없습니다."))

  return iamport.payment.getByImpUid({
    imp_uid: data.imp_uid
  }).then(result => {
    const resData = result.response
    if(resData.status === 'paid' && amount === PRICE) {
      if(!User.checkSession(event)) return cancelPayment(data.imp_uid, "[401] 로그인이 필요합니다.", callback)
      const token = event.headers.Authorization
      // TODO : 아마 외부통신 열어야 될 것 같음
      return User.fromToken(token)
        .then(user => authorizePayment(user, data.imp_uid)
            .then(() => callback(null, response(200, "성공인가")))
            .catch(err => callback(err))
        )
        .catch(err => cancelPayment(data.imp_uid, "[403] 유효하지 않은 세션입니다.", callback))
    } else {
      return cancelPayment(data.imp_uid, "[412] 결제되지 않았거나 액수가 일치하지 않습니다.", callback)
    }
  }).catch(err => callback(new Error("[404] 유효하지 않은 결제 아이디입니다.")))


}
