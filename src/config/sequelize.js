const Sequelize = require('sequelize')
if (process.env.NODE_ENV === 'dev') {
  // NODE_ENV 환경변수를 dev로 세팅할 경우, {root}/.env 파일에서 환경변수 읽어옵니다.
  require('dotenv').config()
}

module.exports =
  new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    pool: {
      max: 1,
      idle: 100,
    },
    operatorsAliases: false,
  })
