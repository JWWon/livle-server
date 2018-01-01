// Libraries
const faker = require('faker')
const _ = require('lodash')
// Require Partner to add partner_id field to Ticket model
const User = require('../../src/user/user')
const Subscription = require('../../src/subscription')
const Ticket = require('../../src/ticket/ticket')
const Reservation = require('../../src/reservation/reservation')

const oneMonthLater = () => {
  let date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date
}

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
    console.log('Users created')

    const creatingSubscriptions = _.map(users, (user) =>
      Subscription.create({
        user_id: user.id,
        paid_at: new Date(),
        valid_by: oneMonthLater(),
      })
    )

    Promise.all(creatingSubscriptions).then((subs) => {
      console.log('Subscriptions created')

      return Ticket.findAll().then((tickets) => {
        const creatingReservations = _.map(subs, (s) =>
          Reservation.create({
            ticket_id: _.sample(tickets).id,
            subscription_id: s.id,
            reserved_at: new Date(),
          })
        )
        return Promise.all(creatingReservations)
      })
    })
  })
