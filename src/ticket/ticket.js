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
  music_id: S.STRING,
  video_id: S.STRING,
  article: S.STRING,
  checkin_code: S.INTEGER,
},
  { timestamps: false }
)

const Artist = require('./artist')
Ticket.hasMany(Artist, { foreignKey: { name: 'ticket_id', allowNull: false } })

Ticket.until = (until) => new Promise((resolve, reject) =>
  Ticket.findAll({
    where: {
      start_at: { [S.Op.gt]: new Date(), [S.Op.lt]: until },
    },
  }).then((tickets) =>
    Promise.all(
      _.map(tickets, (t) => t.getArtists())
    ).then((artistsArray) => resolve(
      _.zipWith(
        tickets, artistsArray,
        (t, aArr) => {
          let ticket = t.dataValues
          let artists = _.map(aArr, (a) => a.dataValues)
          ticket.artists = artists
          return ticket
        }
      )
    ))
  ).catch((err) => reject(err))
)

const Reservation = require('../reservation/reservation')
Ticket.hasMany(Reservation, {
  foreignKey: { name: 'ticket_id', allowNull: false },
})

module.exports = Ticket
