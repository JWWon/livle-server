'use strict'
const Ticket = require('./ticket')

module.exports = (params, respond) => {
  let date = new Date()
  date.setDate(date.getDate() + 7) // 시작일 기준 지금으로부터 일주일 후까지의 공연 검색

  return Ticket.until(date)
    .then((tickets) => respond(200, tickets))
    .catch((err) => respond(500, err))
}
