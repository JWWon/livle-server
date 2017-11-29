'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.getSubscription()
      .then((subscription) => {
        if (!subscription) {
          return respond(404, '구독 정보가 없습니다.')
        }

        return iamport.subscribe_customer.delete({
          customer_uid: subscription.id,
        }).then((res) =>
          subscription.destroy().then((res) =>
            respond(200)
          )
          /*
          subscription.update({ cancelled_at: new Date() })
          .then(res => callback(null, response(200)))
          */
        ).catch((err) =>
          respond(500, err)
        )
      })
    ).catch((err) =>
      respond(401, '로그인이 필요합니다.')
    )
}
