// Use with cautions
// It forcefully syncs the schema

const FreeTrial = require('../src/free_trial')
const User = require('../src/user/user')
const Ticket = require('../src/ticket/ticket')
const Artist = require('../src/ticket/artist')
const Partner = require('../src/partner/partner')
const Reservation = require('../src/reservation/reservation')

const dropTables =
  FreeTrial.drop()
  .then(() => Reservation.drop())
  .then(() => User.drop())
  .then(() => Artist.drop())
  .then(() => Ticket.drop())
  .then(() => Partner.drop())
  .catch((err) => {
    console.error('Failed to drop tables', err)
    process.exit(1)
  })

const migrateTables = () =>
  User.sync()
    .then(() => Partner.sync())
    .then(() => Ticket.sync())
    .then(() => Artist.sync())
    .then(() => Reservation.sync())
    .then(() => FreeTrial.sync())
    .catch((err) => {
      console.error('Failed to migrate tables', err)
      process.exit(1)
    })

module.exports = new Promise((resolve, reject) =>
  dropTables.then(() => migrateTables()).then(() => {
    console.log('Migration succeeded')
    return resolve()
  }).catch((err) => reject(err))
)
