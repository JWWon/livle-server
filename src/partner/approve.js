'use strict'

const Partner = require('./partner')
const _ = require('lodash')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')
  const partnerId = params.path && params.path.partnerId

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((currPartner) => {
      if (!currPartner.isAdmin) return respond(403, '권한이 없습니다.')

      return Partner.findOne({ where: { id: partnerId } })
        .then((target) => target.update({ approved: true }))
        .then((updatedTarget) =>
          respond(200, _.omit(updatedTarget.dataValues, 'password'))
        ).catch((err) => respond(500, err))
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
