'use strict'

const User = require('./user')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')
  const fcmToken = params.query && params.query.fcmToken
  const updateFcmToken = (user) => new Promise((resolve, reject) => {
      if (fcmToken && fcmToken !== user.fcm_token) {
        user.update({ fcm_token: fcmToken })
          .then((user) => resolve(user))
          .catch((err) => reject(err))
      } else {
        resolve(user)
      }
  })

  return User.fromToken(params.auth)
    .then((user) =>
      updateFcmToken(user).then((user) =>
        user.deepUserData().then((userData) => respond(200, userData))
      ).catch((err) => respond(500, err))
    ).catch((err) => {
      console.error(err)
      respond(403, '유효하지 않은 세션입니다.')
    })
}
