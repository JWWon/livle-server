'use strict'

const FCM = require('fcm-push')
if (process.env.NODE_ENV === 'dev') {
  // NODE_ENV 환경변수를 dev로 세팅할 경우, {root}/.env 파일에서 환경변수 읽어옵니다.
  require('dotenv').config()
}
const serverKey = process.env.FCM_SERVER_KEY
const fcm = new FCM(serverKey)

module.exports = (to, body) =>
  fcm.send({
    to: to,
    notification: {
      body: body,
    },
  })
