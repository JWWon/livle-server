// Libraries
const faker = require('faker')
const _ = require('lodash')
// Require Partner to add partner_id field to Ticket model
const User = require('../../src/user/user')
const Ticket = require('../../src/ticket/ticket')
const Reservation = require('../../src/reservation/reservation')

const users = _.times(30, () => {
  return User.create({
    email: faker.internet.email(),
    nickname: faker.name.findName(),
    password: 'fakepassword',
    card_name: faker.finance.account(),
    last_four_digits: '1234',
  })
})

module.exports = () => Promise.all(users)
  .then((users) => {
    console.log('User created')
    return Ticket.findAll().then((tickets) => {
      const creatingReservations = _.map(users, u => {
        Reservation.make(u, _.sample(tickets).id)
      })
      return Promise.all(creatingReservations)
    })
  })
