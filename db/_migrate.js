const sequelize = require('../src/config/sequelize')
const FreeTrial = require('../src/free_trial')
const Subscription = require('../src/subscription')
const User = require('../src/user/user')
const Ticket = require('../src/ticket/ticket')
const Artist = require('../src/ticket/artist')
const Partner = require('../src/partner/partner')
const Reservation = require('../src/reservation/reservation')

const migrateTables = () =>
  User.sync()
    .then(() => Subscription.sync())
    .then(() => FreeTrial.sync())
    .then(() => {
      FreeTrial.hasOne(User, {
        foreignKey: 'free_trial_id',
      })
      Subscription.hasOne(User, {
        as: 'CurrentSubscription', foreignKey: 'current_subscription_id',
      })
      Subscription.hasOne(User, {
        as: 'NextSubscription', foreignKey: 'next_subscription_id',
      })
      return User.sync({ alter: true })
    })
    .then(() => Partner.sync())
    .then(() => Ticket.sync())
    .then(() => Artist.sync())
    .then(() => Reservation.sync())
    .catch((err) => {
      console.error('Failed to migrate tables', err)
      process.exit(1)
    })

module.exports = () => new Promise((resolve, reject) =>
  sequelize.getQueryInterface().dropAllTables()
  .then(() => migrateTables())
  .then(() => {
    console.log('Migration succeeded')
    return resolve()
  }).catch((err) => reject(err))
)
