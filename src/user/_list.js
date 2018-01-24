'use strict'

const Partner = require('../partner/partner')
const Subscription = require('../subscription')
const Reservation = require('../reservation/reservation')
const User = require('./user')
const _ = require('lodash')
const perPage = 20

const fetchList = async (page) => {
  const counts = await User.count()
  const users = await User.findAll({
    include: [{
      model: Subscription,
      include: [{ model: Reservation }],
    }],
    offset: (page - 1) * perPage,
    limit: perPage,
  })
  const userList = _.map(users, (u) => {
    const uData = u.dataValues
    uData.password = undefined
    return uData
  })
  return {
    total_pages: Math.ceil(counts / perPage),
    current_page: page,
    data: userList,
  }
}

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  const page = params.query && Number(params.query.page)
  if (!page || page < 1) {
    return respond(400, '요청한 페이지가 없거나 잘못 되었습니다..')
  }

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin()) return respond(403, '권한이 없습니다.')

      fetchList(page).then((result) => respond(200, result))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
