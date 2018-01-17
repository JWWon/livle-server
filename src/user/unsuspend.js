'use strict'

const Partner = require('../partner/partner')
const User = require('./user')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')
  const userId = params.path && params.path.userId
  if (!userId) return respond(400)

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((currPartner) => {
      if (!currPartner.isAdmin) return respond(403, '권한이 없습니다.')
      User.findById(userId)
        .then((user) => user.update({ suspended_by: null }))
        .then((user) => {
          const uData = user.dataValues
          uData.password = undefined
          respond(200, uData)
        })
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
