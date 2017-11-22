'use strict'
const Ticket = require('./ticket')
const User = require('../user/user')
const response = require('../response')
const Op = require('sequelize').Op

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  if(!User.checkSession(event)) return callback(new Error("[401] 로그인이 필요합니다."))

  var date = new Date()
  date.setDate(date.getDate() + 7) // 시작일 기준 지금으로부터 일주일 후까지의 공연 검색
  const now = new Date()

  return Ticket.findAll({
    where: {
      start_at: { [Op.gt]: now, [Op.lt]: date }
    }
  }).then(tickets => {
    // TODO : Artist 매달기
    return callback(null, response(200, tickets))
  }).catch(err => callback(err))
}
