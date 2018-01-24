'use strict'

const Op = require('sequelize').Op
const Ticket = require('./ticket')
const Partner = require('../partner/partner')
const Artist = require('./artist')
const perPage = 20

const fetchList = async (page, where) => {
  const counts = await Ticket.count({ where: where })
  const _tickets = await Ticket.findAll({
    where: where,
    include: [{ model: Artist }],
    offset: (page - 1) * perPage,
    limit: perPage,
  })
  const tickets = await Ticket.withReservedCount(_tickets)
  return {
    total_pages: Math.ceil(counts / perPage),
    current_page: page,
    data: tickets,
  }
}

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  const page = params.query && Number(params.query.page)
  if (!page || page < 1) {
    return respond(400, '요청한 페이지가 없거나 잘못 되었습니다..')
  }

  const title = params.query && params.query.title
  const state = params.query && params.query.state
  const partnerId = params.query && params.query.partnerId
  const buildWhere = () => {
    if (!title && !state && !partnerId) return undefined
    let where = {}
    const now = new Date()
    if (title) where.title = { [Op.like]: `%${title}%` }
    if (state === 'due') {
      where.end_at = { [Op.gte]: now }
    } else if (state === 'end') {
      where.end_at = { [Op.lt]: now }
    }
    if (partnerId) where.partner_id = partnerId
    return where
  }
  const where = buildWhere()

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin) {
        if (where.partner_id && where.partner_id !== partner.id) {
          return respond(403, '권한이 없습니다.')
        } else {
          where = where || { }
          where.partner_id = partnerId
        }
      }

      fetchList(page, where).then((result) => respond(200, result))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
