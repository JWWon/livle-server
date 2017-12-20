'use strict'

const _ = require('lodash')
const Op = require('sequelize').Op
const User = require('../user/user')

const tomorrow = () => {
  let date = new Date()
  date.setHours(24, 0, 0)
  return date
}

module.exports = (params, respond) => {
  User.findAll({
    where: {
      last_four_digits: { [Op.ne]: null },
      cancelled_at: null,
      valid_by: { [Op.lt]: tomorrow() }
    }
  }).then((users) => _.map(users, (user) =>
    // TODO implement
    user.pay().then((user) => {
    }).catch((err) => {
    })
  )
  )
}
