'use strict'

const Partner = require('../partner/partner')
const User = require('./user')
const _ = require('lodash')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin) return respond(403, '권한이 없습니다.')

      return User.findAll().then((users) => {
        const userList = _.map(users, (u) => {
          const uData = u.dataValues
          uData.password = undefined
          return uData
        })
        return respond(200, userList)
      })
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
