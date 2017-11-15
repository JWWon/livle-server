'use strict';

const expect = require('chai').expect
const handler = require('../handler')

var authToken = ''

const test = (func, params, callback) => {
  func({ headers: { Authorization: authToken }, body: JSON.stringify(params) }, {}, callback)
}

describe('User', function() {
  const userEmail = 'test@test.com'
  const userPass = 'test'

  it('successful creation', function(done) {
    const callback = (error, result) => {
      const res = JSON.parse(result.body)
      authToken = res.token
      expect(result).to.exist
      done()
    }

    test(handler.userCreate,
      { email: userEmail, password: userPass },
      callback)
  })

  it('creation failure when no password', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(400)
        done()
    }

    test( handler.userCreate,
      { email: 'abc@abc.com' },
      callback
    )
  })

  it('creation failure on duplicate email', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(403)
      done()
    }

    test( handler.userCreate,
      { email: 'test@test.com', password: 'testtest' },
      callback
    )
  })

  it('creation failure on invalid email', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(405)
      done()
    }

    test( handler.userCreate,
      { email: 'hahahacom', password: 'hello' },
      callback
    )
  })

  it('successful retrieval', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userGet,
      { },
      callback
    )
  })

  it('successful deletion', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userDestroy,
      { email: userEmail, password: userPass },
      callback
    )
  })

})
