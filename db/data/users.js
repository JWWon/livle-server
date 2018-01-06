// Libraries
const faker = require('faker')
const _ = require('lodash')
const User = require('../../src/user/user')
const Subscription = require('../../src/subscription')
const Ticket = require('../../src/ticket/ticket')
const Reservation = require('../../src/reservation/reservation')
const FreeTrial = require('../../src/free_trial')

require('dotenv').config() // .env 파일에서 환경변수 읽어오기
const paymentInfo = {
  cardNumber: process.env.CARD_NUMBER,
  expiry: process.env.EXPIRY,
  birth: process.env.BIRTH,
  password: process.env.PASSWORD,
  skipTrial: true,
}

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

const users = _.times(100, () => {
  return User.create({
    email: faker.internet.email(),
    nickname: faker.name.findName(),
    password: 'fakepassword',
    card_name: faker.finance.account(),
    last_four_digits: '1234',
  })
})

const now = new Date()

const createUserWithValidSubscription = (email) =>
  User.signUp(email, 'fakepassword')
    .then((user) => User.findOne({ where: { email: email } }))
    .then((user) => user.subscribe(paymentInfo))
    .then((user) => User.findOne({ where: { email: email } }))

const fakeExpire = (subscription) => subscription.update({
  from: startOfDay(nDaysFrom(-31, now)),
  to: nDaysFrom(-1, now),
}).then((sub) => sub.getNext()).then((nextSub) => nextSub.update({
  from: startOfDay(now),
  to: nDaysFrom(30, now),
}))

const subscriptionTesters = () => {
  const freeTrialDone = FreeTrial.create({ card_hash: 'test' })
    .then((ft) => User.signUp('freeTrialDone', 'fakepassword')
      .then((user) => User.findOne({ where: { email: 'freeTrialDone' } }))
      .then((user) => user.update({ free_trial_id: ft.id }))
    )
  const subscriptionExpired =
    createUserWithValidSubscription('subscriptionExpired')
    .then((user) => user.getSubscription())
    .then((sub) => fakeExpire(sub))

  const subscriptionCancelledAndExpired =
    createUserWithValidSubscription('cancelledAndExpired')
    .then((user) => user.getSubscription()
      .then((sub) => fakeExpire(sub))
      .then((sub) => user.unsubscribe())
    )

  return Promise.all([
    freeTrialDone,
    subscriptionExpired,
    subscriptionCancelledAndExpired,
  ])
}

module.exports = () => new Promise((resolve, reject) =>
  subscriptionTesters().then(() =>
    Promise.all(users)
  ).then((users) => {
    console.log('Users created')

    const fromDate = startOfDay(now)
    const toDate = nDaysFrom(30, now)

    const creatingSubscriptions = _.map(users, (user) =>
      new Promise((resolve, reject) =>
        Subscription.create({
          user_id: user.id,
          paid_at: now,
          from: fromDate,
          to: toDate,
        }).then((newSub) => newSub.createNext())
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
