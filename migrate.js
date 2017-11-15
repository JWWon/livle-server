const userMigration = () => require('./src/user/user').sync()
  .then(() => {
    console.log('User migrated')
    partnerMigration()
  }).catch(err => {
    console.error('Failed to migrate User', err)
    process.exit(1)
  })

const partnerMigration = () => require('./src/partner/partner').sync()
  .then(() => {
    console.log('Parnter migrated')
    ticketMigration()
  }).catch(err => {
    console.error('Failed to migrate Partner', err)
    process.exit(1)
  })

const ticketMigration = () => require('./src/ticket/ticket').sync()
  .then(() => {
    console.log('Ticket migrated')
    process.exit()
  }).catch(err => {
    console.error('Failed to migrate Ticket', err)
    process.exit(1)
  })


userMigration()
