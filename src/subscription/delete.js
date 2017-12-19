'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.getSubscriptions({
        where: {
          cancelled_at: null,
        },
      })
      .then((subs) => {
        if (subs.length === 0) {
          return respond(404, '구독 정보가 없습니다.')
        }

        const subscription = subs[0]
        return iamport.subscribe_customer.delete({
          customer_uid: subscription.id,
        }).then((res) =>
          subscription.update({ cancelled_at: new Date() })
          .then((res) =>
            respond(200)
          )
        ).catch((err) =>
          respond(500, err)
        )
      })
    ).catch((err) =>
      respond(401, err)
    )
}
