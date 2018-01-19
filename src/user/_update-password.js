'use strict'
const User = require('./user')

module.exports = (params, respond) => {
  if (!params.body.token || !params.body.password) {
    return respond(400)
  }

  return User.findOne({
    where: {
      password_reset_token: params.body.token,
    },
  }).then((user) => !user ? respond(404)
    : user.updatePassword(params.body.password)
    .then(() => respond(200))
    .catch((err) => respond(500, err))
  )
}
