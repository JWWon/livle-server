'use strict'
const Ticket = require('./ticket')
const Partner = require('../partner/partner')
const Artist = require('./artist')
const perPage = 20

const fetchList = async (page) => {
  const counts = await Ticket.count()
  const _tickets = await Ticket.findAll({
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

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (!partner.isAdmin) return respond(403, '권한이 없습니다.')

      fetchList(page).then((result) => respond(200, result))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
