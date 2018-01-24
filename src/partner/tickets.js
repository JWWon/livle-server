'use strict'

const Partner = require('./partner')
const Artist = require('../ticket/artist')
const Ticket = require('../ticket/ticket')
const perPage = 20

const fetchList = async (partner, page) => {
  const counts = await Ticket.count()
  const _tickets = await partner.getTickets({
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
  // 이 파트너의 공연 정보를 가져오고자 합니다.
  const partnerId = params.path && params.path.partnerId

  const page = params.query && Number(params.query.page)
  if (!page || page < 1) {
    return respond(400, '요청한 페이지가 없거나 잘못 되었습니다..')
  }

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (partner.id != partnerId) {
        return respond(403, '권한이 없습니다.')
      }

      fetchList(partner, page)
        .then((result) => respond(200, result))
        .catch((err) => respond(500, err))
    }).catch((err) => {
      if (err) {
        return respond(403, '유효하지 않은 세션입니다.')
      } else {
        return respond(401, '로그인되지 않았습니다.')
      }
    })
}
