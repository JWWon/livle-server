'use strict'
const Partner = require('../partner/partner')
const response = require('../response')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const uuid = require('uuid/v1')

module.exports = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  return Partner.fromHeaders(event.headers)
    .then(partner => {
      if(partner.username != "admin@livle.kr") {
        return callback(new Error("[403] 관리자만 추가할 수 있습니다."))
      }

      const params = {
        Bucket: 'livle',
        Key: uuid(),
        ACL: 'public-read',
        Expires: 120
      }

      return s3.getSignedUrl('putObject', params, (err, url) =>
        callback(err, response(200, url ? { signedUrl: url, filePath: `https://s3.ap-northeast-2.amazonaws.com/${params.Bucket}/${params.Key}` } : null )))
    }).catch(err => {
      return callback(new Error("[401] 로그인 해주세요."))
    })
}
