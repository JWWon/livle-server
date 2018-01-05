'use strict'
const S = require('sequelize')
const sequelize = require('../config/sequelize')
const _ = require('lodash')

const Ticket = sequelize.define('ticket', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: S.STRING, allowNull: false },
  start_at: { type: S.DATE, allowNull: false },
  end_at: { type: S.DATE, allowNull: false },
  image: { type: S.STRING, allowNull: false },
  capacity: { type: S.INTEGER, allowNull: false },
  place: { type: S.STRING, allowNull: false },
  video_id: S.STRING,
  // eslint-disable-next-line new-cap
  checkin_code: S.STRING(4),
},
  { timestamps: false }
)

const Artist = require('./artist')
Ticket.hasMany(Artist, { foreignKey: { name: 'ticket_id', allowNull: false } })

const oneWeekLater = () => {
  let date = new Date()
  date.setDate(date.getDate() + 7)
  return date
}

const Reservation = require('../reservation/reservation')
Ticket.hasMany(Reservation, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})
Reservation.belongsTo(Ticket, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})

Ticket.getList = () => new Promise((resolve, reject) => {
  // 시작일 기준 지금으로부터 일주일 후까지의 공연 검색
  const until = oneWeekLater()

  Ticket.findAll({
    where: {
      start_at: { [S.Op.gt]: new Date(), [S.Op.lt]: until },
    },
    attributes: [
      'id', 'title', 'start_at', 'end_at', 'image', 'place', 'video_id', 'capacity',
    ],
    include: [{ model: Artist }],
  }).then((tickets) => {
    const reserved = _.map(tickets, (ticket) =>
      Reservation.count({ where: { ticket_id: ticket.id } })
    )
    Promise.all(reserved).then((countArray) => {
      const result = _.map(tickets, (ticket, index) => {
        let values = _.omit(ticket.dataValues, 'capacity')
        values.vacancies = ticket.capacity - countArray[index]
        return values
      })
      resolve(result)
    }).catch((err) => {
      console.error(err)
    })
  }).catch((err) => {
    console.error(err)
    reject(err)
  })
})

module.exports = Ticket
