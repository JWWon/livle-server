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

Ticket.withArtists = (tickets, showCode) => new Promise((resolve, reject) =>
  Promise.all(
    _.map(tickets, (t) => t.getArtists())
  ).then((artistsArray) => resolve(
    _.zipWith(
      tickets, artistsArray,
      (t, aArr) => {
        let ticket = t.dataValues
        if (!showCode) ticket.checkin_code = undefined // Hide
        let artists = _.map(aArr, (a) => a.dataValues)
        ticket.artists = artists
        return ticket
      }
    )
  )).catch((err) => reject(err))
)

Ticket.until = (until) => new Promise((resolve, reject) =>
  Ticket.findAll({
    where: {
      start_at: { [S.Op.gt]: new Date(), [S.Op.lt]: until },
    },
  }).then((tickets) =>
    Ticket.withArtists(tickets)
    .then((tickets) => resolve(tickets))
  ).catch((err) => reject(err))
)

module.exports = Ticket
