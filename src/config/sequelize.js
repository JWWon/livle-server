const Sequelize = require('sequelize')
// database, username, password
module.exports = new Sequelize('livle', 'livle', 'livledev', {
  host: "localhost",
  port: "3306",
  dialect: "mysql"
})

