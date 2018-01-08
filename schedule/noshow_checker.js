'use strict'

const _ = require('lodash')
const Op = require('sequelize').Op
const Ticket = require('../src/ticket/ticket')

const now = new Date()

const process = (reservation) => {
  if (reservation.checked_at) {
    throw new Error('Cannot process checked-in reservation')
  }
  return reservation.getUser().then((user) =>
    user.update({ suspended_by: suspendUntil() })
  ).then((user) => reservation.update({ cancelled_at: now }))
}

const processNoshows = (ticket) =>
  ticket.getReservations({
    where: {
      checked_at: { [Op.eq]: null },
    }
  }).then((noshows) => Promise.all(_.map(noshows, process)))
    .then((reservations) => {
      console.log(`Ticket ${ticket.id} : \
      ${reservations.length} noshows processed`)
    }).then((ticket) => ticket.update({ checkin_code: null }))

module.exports = (params, respond) => {
  console.log(`Noshow checker runs at ${now}`)
  Ticket.findAll({
    where: {
      end_at: { [Op.lte]: now },
      checkin_code: { [Op.ne]: null },
    },
  }).then((tickets) => Promise.all(_.map(tickets, processNoshows)))
    .then(() => {
      console.log('Noshow checker successfully completed')
      respond(200)
    }).catch((err) => {
      console.error('Error processing noshows')
      console.error(err)
      respond(500)
    })
}
