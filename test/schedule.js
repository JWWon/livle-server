'use strict'

const User = require('../src/user/user')
const expect = require('chai').expect
const handler = require('../handler')

const test = (func, params, callback) => {
  func({
    headers: { },
    body: JSON.stringify(params.body),
    queryStringParameters: params.query,
    pathParameters: params.path,
    httpMethod: params.httpMethod,
  }, {}, callback)
}

module.exports = () => {
  describe('Subscription renew', function() {
    it('successful renewal', function(done) {
      const callback = (error, result) => {
        if (result.statusCode === 200) {
          done()
        } else {
          done(new Error(result.body))
        }
      }

      const startOfToday = () => {
        let date = new Date()
        date.setHours(0, 0, 0)
        return date
      }
      const thirtyDaysFromNow = () => {
        let date = new Date()
        date.setDate(date.getDate() + 30)
        date.setHours(23, 59, 59)
        return date
      }
      handler.subscriptionRenew({}, {}, callback)
    }).timeout(10000)
  })

  describe('Noshow check', function() {
    it('successful checked', function(done) {
      const callback = (error, result) => {
        if (result.statusCode === 200) {
          done()
        } else {
          done(new Error(result.body))
        }
      }
      handler.noshowChecker({}, {}, callback)
    })
  })

  describe('Destroy user data', function() {
    it('successful destroyal', function(done) {
      done(new Error('Not implemented'))
    })
  })
}
