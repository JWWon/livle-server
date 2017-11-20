'use strict'
const Ticket = require('../ticket')
const User = require('../user/user')
const response = require('../response')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  if(!User.checkSession(event)) return callback(new Error("[401] 로그인이 필요합니다."))

  var date = new Date()
  date.setDate(date.getDate() + 7) // 시작일 기준 지금으로부터 일주일 후까지의 공연 검색

  return Ticket.findAll({
    where: {
      start_at: { [Op.gt]: date }
    }
  }).then(tickets => {
    return callback(null, tickets)
  }).catch(err => callback(err))
}
