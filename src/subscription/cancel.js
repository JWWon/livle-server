'use strict'

const User = require('../user/user')

module.exports = (params, respond) => {
  const token = params.auth

  return User.fromToken(token)
    .then((user) =>
      user.unsubscribe().then(() =>
        user.deepUserData()
        .then((userData) => respond(200, userData))
      ).catch((err) => {
        if (err.code === 404) {
          respond(404, err.err)
        } else {
          console.log(err)
          respond(500, err)
        }
      })
    ).catch((err) => respond(401, err))
}
