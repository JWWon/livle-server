'use strict'

const iamport = require('../config/iamport')
const Subscription = require('./subscription')
const _ = require('lodash')
const doPay = require('./pay')

module.exports = (params, respond) => {
  const now = new Date()
  Subscription.findAll().then((subscriptions) =>
    _.map(subscriptions, s => {
      // TODO implement
    })
  )
}
