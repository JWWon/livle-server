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
        expect(result.statusCode).to.equal(200)
        done()
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
      User.findOne({ where: { email: userEmail } })
        .then((user) => user.getActiveSubscriptions()) // TODO change
        .then(([curr, next]) => next.update({
          from: startOfToday(),
          to: thirtyDaysFromNow(),
        })).then(() => {
          test( handler.subscriptionRenew,
            {},
            callback
          )
        })
    })
  })

  describe('Noshow check', function() {
  })

  describe('Destroy user data', function() {
  })
}
