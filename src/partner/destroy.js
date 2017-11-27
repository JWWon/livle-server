'use strict'
const Partner = require('./partner')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  const data = JSON.parse(event.body)
  if(!data.username || !data.password) {
    return callback(null, response(400, null, '아이디와 비밀번호를 입력해주세요.'))
  }

  return Partner.destroy({
    where: {
      username: data.username,
      password: data.password,
    },
  }).then(() => {
    return callback(null, response(200, null))
  }).catch((err) => {
    return callback(null, response(403, null, '일치하는 회원정보가 없습니다.'))
  })
}
