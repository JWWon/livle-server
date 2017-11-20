// Use with cautions
// It forcefully syncs the schema

const User = require('./src/user/user')
const Ticket = require('./src/ticket/ticket')
const Partner = require('./src/partner/partner')

const dropTables = User.drop().then(() => Ticket.drop()).then(() => Partner.drop()).catch(err => {
  console.error('Failed to drop tables', err)
  process.exit(1)
})

const migrateTables = () => User.sync().then(() => Partner.sync()).then(() => Ticket.sync()).catch(err => {
  console.error('Failed to migrate tables', err)
  process.exit(1)
})

dropTables.then(() => migrateTables()).then(() => {
  console.log("Migration succeeded")
  process.exit()
})
