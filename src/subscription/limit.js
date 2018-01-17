'use strict'

const Partner = require('../partner/partner')
const Subscription = require('.')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')
  const subscriptionId = params.path && params.path.subscriptionId
  const limit = params.body && params.body.limit
  if (!subscriptionId || !limit) return respond(400)

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((currPartner) => {
      if (!currPartner.isAdmin) return respond(403, '권한이 없습니다.')
      Subscription.findById(subscriptionId)
        .then((sub) => sub.update({ limit: limit }))
        .then((sub) => respond(200, sub))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}

