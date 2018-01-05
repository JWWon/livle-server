'use strict'
const Ticket = require('./ticket')

module.exports = (params, respond) =>
  Ticket.getList()
    .then((tickets) => respond(200, tickets))
    .catch((err) => {
      console.error(err)
      respond(500, err)
    })
