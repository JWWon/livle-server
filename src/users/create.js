'use strict';
const User = require('./user')

module.exports = (event, callback) => {
  const data = JSON.parse(event.body)

  return User.create(data).then(user => {
    callback(null, user)
  }).catch(err => {
    callback(err)
  })
};
