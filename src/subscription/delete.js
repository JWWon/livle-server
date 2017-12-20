'use strict'

const User = require('../user/user')
const iamport = require('../config/iamport')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) => !user.isSubscribing() ?
      respond(404, '구독 정보가 없습니다.')
      : iamport.subscribe_customer.delete({
          customer_uid: user.id,
        }).then((res) =>
          user.cancelReservationsAfter(user.valid_by)
          .then(() => user.update({
            card_name: null,
            last_four_digits: null,
            cancelled_at: new Date(),
          })).then((user) => respond(200, user))
        ).catch((err) => respond(500, err))
    ).catch((err) => respond(401, err))
}
