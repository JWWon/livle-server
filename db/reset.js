// Use with cautions
// It forcefully syncs the schema

const migrate = require('./_migrate')
const testData = require('./data')
const Partner = require('../src/partner/partner')

migrate().then(() => {
  Partner.create({ username: 'admin@livle.kr',
    password: 'livle',
    company: 'Livle',
    approved: true,
  }).then(() => {
    console.log('Admin account created')
    testData().then(() => {
      console.log('Test data added')
      process.exit()
    }).catch((err) => {
      console.error('Failed to insert test data', err)
      process.exit(1)
    })
  }).catch((err) => {
    console.error('Failed to create admin account', err)
      process.exit(1)
  })
})
