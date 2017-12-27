'use strict'
const Partner = require('../partner/partner')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const uuid = require('uuid/v1')

module.exports = (params, respond) => {
  if (!params.auth) return respond(401, '로그인되지 않았습니다.')

  return Partner.fromHeaders({ Authorization: params.auth })
    .then((partner) => {
      if (partner.username != 'admin@livle.kr') {
        return respond(403, '관리자만 추가할 수 있습니다.')
      }

      const params = {
        Bucket: 'livle',
        Key: uuid(),
        ACL: 'public-read',
        Expires: 120,
      }

      return s3.getSignedUrl('putObject', params, (err, url) =>
        err ? respond(500, err) : respond(200, {
          signedUrl: url,
          filePath: `https://s3.ap-northeast-2.amazonaws.com/${params.Bucket}/${params.Key}`,
        } )
      )
    }).catch((err) => {
      return respond(401, '로그인 해주세요.')
    })
}
