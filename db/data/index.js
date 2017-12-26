module.exports = () => require('./tickets')()
  .then(() => {
    console.log('Success for tickets')
    return require('./users')().then(() => {
      console.log('Success for users')
    })
  })
