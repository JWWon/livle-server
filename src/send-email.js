'use strict'

const aws = require('aws-sdk')
const ses = new aws.SES({ region: 'us-west-2' })
const s3 = new aws.S3()
const mark = require('markup-js')

/*
 * s3의 'livle' 버켓 'templates/{{fileName}}.html' 경로에
 * 템플릿 파일을 업로드해두어야 합니다.
 *
 * 해당 파일은 이 리포지토리 안의
 * templates/{{fileName}}.html과 동일해야 합니다. (버전관리 위함)
 */
const getTemplate = (fileName) => new Promise((resolve, reject) =>
  s3.getObject({
    Bucket: 'livle',
    Key: `templates/${fileName}.html`,
  }, (err, data) =>
    err ? reject(err) : resolve(data.Body.toString())
  )
)

module.exports = (toAddress, title, templateName, markupData) =>
  new Promise((resolve, reject) =>
    getTemplate(templateName).then((template) => {
      const message = mark.up(template, markupData)

      const sesParams = {
        Destination: {
          ToAddresses: [toAddress],
        },
        Message: {
          Subject: {
            Data: title,
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

      resolve()
        /* Temporarily not sending (on suspension)
      return ses.sendEmail(sesParams,
        (err, data) => err ? reject(err) : resolve())
        */
    })
  )
