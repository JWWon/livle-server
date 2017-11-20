'use strict';

const expect = require('chai').expect
const handler = require('../handler')

var authToken = ''
var headers = {}

const test = (func, params, callback) => {
  func({ headers: { Authorization: authToken }, body: JSON.stringify(params.body), queryStringParameters: params.query }, {}, callback)
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
      { body: { email: userEmail, password: userPass } },
      callback)
  })

  it('creation failure when no password', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(400)
        done()
    }

    test( handler.userCreate,
      { body: { email: 'abc@abc.com' } },
      callback
    )
  })

  it('creation failure on duplicate email', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(403)
      done()
    }

    test( handler.userCreate,
      { body: { email: 'test@test.com', password: 'testtest' } },
      callback
    )
  })

  it('creation failure on invalid email', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(405)
      done()
    }

    test( handler.userCreate,
      { body: { email: 'hahahacom', password: 'hello' } },
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

  it('successful signin', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userSignin,
      { query: { email: userEmail, password: userPass } },
      callback
    )
  })

  it('successful deletion', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userDestroy,
      { body: { email: userEmail, password: userPass } },
      callback
    )
  })

})

describe('Partner', function() {
  it('successful creation', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerCreate,
      { body: { username: "test@test.com", company: "test", password: "test" } },
      callback )
  })

  it('successful deletion', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerDestroy,
      { body: { username: "test@test.com", password: "test" } },
      callback )
  })

  it('successful signin', function(done) {
    const callback = (error, result) => {
      const res = JSON.parse(result.body)
      authToken = res.token
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerSignin,
      { query: { username: 'admin@livle.kr', password: 'livle' } },
      callback
    )
  })

  it('successfully get user from session', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerGet,
      { }, callback)
  })
})

describe('Ticket', function() {
  it('successful creation', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.ticketCreate,
      { body: { title: '테스트 콘서트', start_at: new Date(), end_at: new Date(),
        image: "test", capacity: 100, place: "판교" } },
      callback
    )
  })
})
