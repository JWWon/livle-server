'use strict'

const User = require('./user')
const Reservation = require('../reservation/reservation')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return User.fromToken(params.auth)
    .then((user) => {
      let userData = user.userData()
      return user.getActiveSubscriptions()
        .then((subs) => {
          return userData
          if (subs.length > 0) {
            const currSub = subs[0]
            currSub.getUsedCount()
              .then((used) => {
                let s = currSub.dataValues
                s.used = used
                userData.currentSubscription = s
                if (subs.length > 1) {
                  const nextSub = subs[1]
                  return nextSub.getUsedCount()
                    .then((used) => {
                      let s = nextSub.dataValues
                      s.used = used
                      userData.nextSubscription = s
                      return userData
                    })
                } else {
                  return userData
                }
              })
          }
        }).then((userData) => respond(200, userData)
        ).catch((err) => respond(500, err))
    }).catch((err) => {
      console.error(err)
      respond(403, '유효하지 않은 세션입니다.')
    })
}
