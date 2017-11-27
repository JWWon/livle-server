'use strict'

const User = require('../user/user')
const response = require('../response')
const iamport = require('../config/iamport')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const token = event.headers.Authorization
  return User.fromToken(token)
    .then((user) =>
      user.getSubscription()
      .then((subscription) => {
        if(!subscription) {
          return callback(new Error('[404] 구독 정보가 없습니다.'))
        }

        return iamport.subscribe_customer.delete({
          customer_uid: subscription.id,
        }).then((res) =>
          subscription.destroy().then((res) => callback(null, response(200)))
          /*
          subscription.update({ cancelled_at: new Date() })
          .then(res => callback(null, response(200)))
          */
        ).catch((err) => callback(err))
      })
    ).catch((err) => {
 console.error(err); callback(new Error('[401] 로그인이 필요합니다.'))
})
}
