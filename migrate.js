// Use with cautions
// It forcefully syncs the schema

const User = require('./src/user/user')
const Ticket = require('./src/ticket/ticket')
const Artist = require('./src/ticket/artist')
const Partner = require('./src/partner/partner')
const Subscription = require('./src/subscription/subscription')

const dropTables =
  Subscription.drop()
  .then(() => User.drop())
  .then(() => Artist.drop())
  .then(() => Ticket.drop())
  .then(() => Partner.drop())
  .catch(err => {
    console.error('Failed to drop tables', err)
    process.exit(1)
  })

const migrateTables = () =>
  User.sync()
    .then(() => Partner.sync())
    .then(() => Ticket.sync())
    .then(() => Artist.sync())
    .then(() => Subscription.sync())
    .catch(err => {
      console.error('Failed to migrate tables', err)
      process.exit(1)
    })

dropTables.then(() => migrateTables()).then(() => {
  console.log("Migration succeeded")
  process.exit()
})
