'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.getActiveSubscriptions()
      .then(([currSub, nextSub]) => {
        if (!nextSub) {
          return respond(404, '구독 정보가 없습니다.')
        }
        return iamport.subscribe_customer.delete({
          customer_uid: user.id,
        }).then((res) => nextSub.cancel())
          .then(() => user.update({
            card_name: null,
            last_four_digits: null,
            cancelled_at: new Date(),
          })
          ).then((user) => {
            let userData = user.userData()
            return currSub.getUsedCount()
              .then((count) => {
                let sub = currSub.dataValues
                sub.used = count
                userData.currentSubscription = sub
                return respond(200, userData)
              })
          })
          .catch((err) => {
            console.error(err)
            respond(500, err)
          })
      })
    ).catch((err) => {
      console.error(err)
      respond(401, err)
    })
}
