const S = require('sequelize')
const sequelize = require('../config/sequelize')

const Artist = sequelize.define('artist', {
  id: { type: S.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: S.STRING, allowNull: false },
  image: { type: S.STRING, allowNull: false },
},
  { timestamps: false }
)

module.exports = Artist
