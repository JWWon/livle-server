'use strict'

const https = require('https')
const User = require('./user')

const fetchFromFacebook = (token) => new Promise((resolve, reject) => {
  const url =
    `https://graph.facebook.com/me?fields=email,name&access_token=${token}`

  return https.get(url, (res) => {
    if (res.statusCode !== 200) {
      return reject()
    }
    res.setEncoding('utf8')
    res.on('data', function(body) {
      return resolve(JSON.parse(body))
    })
  })
})

module.exports = (params, respond) => {
  const token = params.body.accessToken

  if (!token) return respond(400)

  return fetchFromFacebook(token).then((data) =>
    User.findOrCreate({
      where: {
        email: data.email,
      }, defaults: {
        nickname: data.name,
        facebook_token: token,
      },
    }).spread((user, created) => {
      if (user.password) return respond(403)
      let userData = user.dataValues
      userData.token = user.getToken()
      return respond(created ? 201 : 200, userData)
    }).catch((err) => respond(500, err))
  ).catch((err) => respond(401, err))
}
