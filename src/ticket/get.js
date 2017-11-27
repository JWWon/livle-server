'use strict'
const Ticket = require('./ticket')
const User = require('../user/user')
const Partner = require('../partner/partner')

module.exports = (params, respond) => {

  const getTickets = () => {
    let date = new Date()
    date.setDate(date.getDate() + 7) // 시작일 기준 지금으로부터 일주일 후까지의 공연 검색

    return Ticket.until(date)
      .then(tickets => respond(200, tickets))
      .catch(err => respond(500, err))
  }

  if(User.checkSession({ headers: { Authorization: params.auth } })) {
    return getTickets()
  }
  Partner.fromHeaders({ Authorization: params.auth })
    .then(partner => getTickets())
    .catch(err => respond(401, "로그인이 필요합니다."))

}
