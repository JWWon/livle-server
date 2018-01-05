'use strict'

const Pusher = require('pusher')

if (process.env.NODE_ENV === 'dev') {
  // NODE_ENV 환경변수를 dev로 세팅할 경우, {root}/.env 파일에서 환경변수 읽어옵니다.
  require('dotenv').config()
}

const pusher = new Pusher({
  appId: '453625',
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: 'ap1',
  encrypted: true,
})

module.exports = pusher
