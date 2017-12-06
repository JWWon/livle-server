'use strict'

const Partner = require('./partner')
const _ = require('lodash')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin) return respond(403, '권한이 없습니다.')

      return Partner.findAll().then((partners) => {
        const partnerList = _.map(partners, (p) => {
          const pData = p.dataValues
          pData.password = undefined
          return pData
        })
        return respond(200, partnerList)
      })
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
