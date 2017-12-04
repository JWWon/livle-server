'use strict'

const aws = require('aws-sdk')
const ses = new aws.SES({ region: 'us-west-2' })
const s3 = new aws.S3()
const mark = require('markup-js')
const User = require('./user')
const uuid = require('uuid/v1')


/*
 * s3의 'livle' 버켓 'templates/request_password.html' 경로에
 * 템플릿 파일을 업로드해두어야 합니다.
 *
 * 해당 파일은 이 리포지토리 안의
 * templates/request_password.html과 동일해야 합니다. (버전관리 위함)
 */
const getTemplate = () => new Promise((resolve, reject) =>
  s3.getObject({
    Bucket: 'livle',
    Key: 'templates/request_password.html',
  }, (err, data) =>
    err ? reject(err) : resolve(data.Body.toString())
  )
)

module.exports = (params, respond) => {
  if (!params.query || !params.query.email) {
    respond(400, '이메일이나 비밀번호가 입력되지 않았습니다.')
  }

  const sendEmail = (user) => new Promise((resolve, reject) =>
    getTemplate().then((template) => {
      const userInfo = {
        nickname: user.nickname || '라이블 유저',
        password_reset_token: user.password_reset_token,
      }
      const message = mark.up(template, userInfo)

      const sesParams = {
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Subject: {
            Data: '라이블 비밀번호 재설정 이메일',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: message,
              Charset: 'UTF-8',
            },
          },
        },
        Source: 'no-reply@livle.co.kr',
      }

      return ses.sendEmail(sesParams,
        (err, data) => err ? reject(err) : resolve())
    })
  )

  return User.findOne({
    where: {
      email: params.query.email,
    },
  }).then((user) => {
    if (!user) return respond(404)
    return user.update({ password_reset_token: uuid() })
      .then((user) => sendEmail(user)
        .then(() => respond(200))
        .catch((err) => respond(500, err))
      )
  }).catch((err) => respond(500, err))
}
