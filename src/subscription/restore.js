'use strict'

const User = require('../user/user')

module.exports = (params, respond) => {
  const token = params.auth
  return User.fromToken(token)
    .then((user) =>
      user.getSubscription()
      .then((currSub) => {
        if (!currSub) return respond(404)
        currSub.createNext()
          .then((subs) => user.deepUserData())
          .then((userData) => respond(200, userData))
          .catch((err) => respond(403, err))
      })
    ).catch((err) => respond(401))
}
