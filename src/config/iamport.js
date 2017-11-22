'use strict'

const Iamport = require('iamport')

if(process.env.NODE_ENV === 'dev') {
  // NODE_ENV 환경변수를 dev로 세팅할 경우, {root}/.env 파일에서 환경변수 읽어옵니다.
  require('dotenv').config()
}

module.exports = new Iamport({
  iamKey: process.env.IMP_KEY,
  impSecret: process.env.IMP_SECRET
})
