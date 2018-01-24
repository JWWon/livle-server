'use strict'

const Partner = require('./partner')
const _ = require('lodash')
const Op = require('sequelize').Op
const perPage = 20

const fetchList = async (page, where) => {
  const counts = await Partner.count({ where: where })
  const partners = await Partner.findAll({
    where: where,
    offset: (page - 1) * perPage,
    limit: perPage,
  })
  const list = _.map(partners, (p) => {
    const pData = p.dataValues
    pData.password = undefined
    return pData
  })
  return {
    total_pages: Math.ceil(counts / perPage),
    current_page: page,
    data: list,
  }
}

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  const page = params.query && Number(params.query.page)
  if (!page || page < 1) {
    return respond(400, '요청한 페이지가 없거나 잘못 되었습니다..')
  }

  const username = params.query && params.query.username
  const company = params.query && params.query.company
  const approved = params.query && params.query.approved
  const buildWhere = () => {
    if (!username && !company && !approved) return undefined
    let where = {}
    if (username)  where.username = { [Op.like]: `%${username}%` }
    if (company) where.company = { [Op.like]: `%${company}%` }
    if (approved) where.approved = (approved == 'true')
    return where
  }
  const where = buildWhere()

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin) return respond(403, '권한이 없습니다.')
      fetchList(page, where).then((result) => respond(200, result))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
