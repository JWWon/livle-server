'use strict'

const _ = require('lodash')
const User = require('./user')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return User.fromToken(params.auth)
    .then((user) =>
      respond(200,
        _.pick(user.dataValues, [
          'email', 'nickname', 'card_name', 'last_four_digits',
          'cancelled_at', 'valid_by', 'suspended_by', 'free_trial_started_at',
        ])
      )
    ).catch((err) => respond(403, '유효하지 않은 세션입니다.'))
}
