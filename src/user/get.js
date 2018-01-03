'use strict'

const _ = require('lodash')
const User = require('./user')
const Reservation = require('../reservation/reservation')

const withUsedCount = (subPromise) =>
  new Promise((resolve, reject) =>
    subPromise.then((subscription) => {
      if (!subscription) return resolve()
      return Reservation.count({ where: { subscription_id: subscription.id } })
        .then((used) => {
          let s = subscription.dataValues
          s.used = used
          return resolve(s)
        })
    }).catch((err) => reject(err))
  )

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return User.fromToken(params.auth)
    .then((user) => {
      const getCurr = withUsedCount(user.getCurrentSubscription())
      const getNext = withUsedCount(user.getNextSubscription())
      return Promise.all([getCurr, getNext])
        .then((subs) => {
          let userData = _.pick(user.dataValues, [
            'email', 'nickname', 'card_name', 'last_four_digits',
            'cancelled_at', 'valid_by', 'suspended_by', 'free_trial_id',
          ])
          userData.currentSubscription = subs[0]
          userData.nextSubscription = subs[1]
          respond(200, userData)
        }
        ).catch((err) => respond(500, err))
    }).catch((err) => respond(403, '유효하지 않은 세션입니다.'))
}
