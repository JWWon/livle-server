'use strict'

const User = require('../user/user')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const email = event.queryStringParameters.email
  const password = event.queryStringParameters.password
  if(!email || !password) callback(new Error("[400] 이메일이나 비밀번호가 입력되지 않았습니다."))

  return User.findOne({ where: { email: email, password: password } })
    .then(user => {
      var userData = user.dataValues
      userData.token = user.getToken()
      return callback(null, response(200, userData))
    })
    .catch(err => callback(null, response(403, null, "일치하는 회원 정보가 없습니다.")))
}
