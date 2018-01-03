// Libraries
const faker = require('faker')
const _ = require('lodash')
// Require Partner to add partner_id field to Ticket model
const User = require('../../src/user/user')
const Subscription = require('../../src/subscription')
const Ticket = require('../../src/ticket/ticket')
const Reservation = require('../../src/reservation/reservation')

const startOfDay = (d) => {
  let date = new Date(d)
  date.setHours(0, 0, 0)
  return date
}

const nDaysFrom = (n, from) => {
  let date = new Date(from)
  date.setDate(date.getDate() + n)
  date.setHours(23, 59, 59)
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

module.exports = () => new Promise((resolve, reject) =>
  Promise.all(users)
  .then((users) => {
    console.log('Users created')

    const now = new Date()
    const fromDate = startOfDay(now)
    const toDate = nDaysFrom(30, now)

    const creatingSubscriptions = _.map(users, (user) =>
      new Promise((resolve, reject) =>
        Subscription.create({
          user_id: user.id,
          from: fromDate,
          to: toDate,
        }).then((newSub) => newSub.approvePayment(user, now))
        .then((subs) => resolve(subs))
        .catch((err) => reject(err))
      )
    )

    Promise.all(creatingSubscriptions).then((subs) => {
      console.log('Subscriptions created')

      return Ticket.findAll().then((tickets) => {
        const creatingReservations = _.map(subs, (s) =>
          Reservation.create({
            ticket_id: _.sample(tickets).id,
            subscription_id: s[0].id,
            reserved_at: new Date(),
          })
        )
        return Promise.all(creatingReservations)
          .then((reservations) => resolve(reservations))
      })
    })
  }).catch((err) => reject(err))
)
