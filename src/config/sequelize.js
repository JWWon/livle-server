const Sequelize = require('sequelize')
// database, username, password
module.exports = new Sequelize('livle', 'root', '12345', {
  host: "localhost",
  port: "3306",
  dialect: "mysql"
})

