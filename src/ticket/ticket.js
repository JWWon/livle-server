const S = require('sequelize')
const sequelize = require('../config/sequelize')

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
  checkin_code: S.INTEGER
},
  { timestamps: false }
)

const Partner = require('../partner/partner')
Ticket.belongsTo(Partner)

module.exports = Ticket
