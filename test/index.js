'use strict';

const expect = require('chai').expect
const handler = require('../handler')
require('dotenv').config() // .env 파일에서 환경변수 읽어오기

var authToken = ''
var headers = {}

const test = (func, params, callback) => {
  func({ headers: { Authorization: authToken }, body: JSON.stringify(params.body),
    queryStringParameters: params.query, pathParameters: params.path }, {}, callback)
}

const userEmail = 'test@test.com'
const userPass = 'test'

describe('User', function() {

  it('successful creation', function(done) {
    const callback = (error, result) => {
      if(error) done(error)
      expect(result.statusCode).to.equal(200)
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
      if(error) done(error)
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
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userSignin,
      { query: { email: userEmail, password: userPass } },
      callback
    )
  })

})

let ticket
describe('Ticket', function() {
  it('successful retrieve of list', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      ticket = res[0]
      done()
    }

    test( handler.ticketGet,
      {},
      callback
    )
  })

  it('reservation failure with no subscription', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      console.log(result)
      expect(result.statusCode).to.equal(400)
      done()
    }

    test( handler.ticketReserve,
      { path: { ticketId: ticket.id } },
      callback
    )
  })
})

describe('Subscription', function() {
  const cardNumber = process.env.CARD_NUMBER
  const expiry = process.env.EXPIRY
  const birth = process.env.BIRTH
  const password = process.env.PASSWORD

  it('successful subscription', function(done) {
    this.timeout(5000)
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.subscriptionCreate,
      { body: { cardNumber: cardNumber, expiry: expiry, birth: birth, password: password} },
      callback
    )
  })

  it('subscription fails if already subscribing', function(done) {
    this.timeout(5000)
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(405)
      done()
    }

    test( handler.subscriptionCreate,
      { body: { cardNumber: cardNumber, expiry: expiry, birth: birth, password: password} },
      callback
    )
  })

  it('successful retrieval', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      expect(res.last_four_digits).to.equal(cardNumber.slice(-4))
      done()
    }

    test( handler.subscriptionGet,
      { },
      callback
    )
  })

  it('successful reservation', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      console.log(result)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.ticketReserve,
      { path: { ticketId: ticket.id } },
      callback
    )
  })

  it('reservation failure on duplicate', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      console.log(result)
      expect(result.statusCode).to.equal(400)
      done()
    }

    test( handler.ticketReserve,
      { path: { ticketId: ticket.id } },
      callback
    )
  })

  let reservation
  it('successful retrieval of reservation', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      reservation = JSON.parse(result.body)[0]
      done()
    }

    test( handler.reservationGet,
      { },
      callback
    )
  })

  it('checkin failure with invalid checkin code', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(403)
      done()
    }

    test( handler.reservationCheckin,
      { path: { reservationId: reservation.id }, body: { code: '1234' } },
      callback
    )
  })

  it('successful cancellation', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.subscriptionDelete,
      { },
      callback
    )
  })
})

describe('User deletion', function() {
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

/*
 *
 * 웹 테스트
 *
 */

describe('Web', () => null)

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

describe('File', function() {
  it('successful signing', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.fileUpload,
      { },
      callback
    )
  })
})

describe('Ticket', function() {
  it('successful creation', function(done) {
    const callback = (error, result) => {
      if(error) return done(error)
      expect(result.statusCode).to.equal(200)
      done()
    }

    var date = new Date()
    date.setDate(date.getDate() + 5)
    test( handler.ticketCreate,
      { body: { title: '테스트 콘서트', start_at: date, end_at: date,
        image: "test", capacity: 100, place: "판교" } },
      callback
    )
  })

  it('successful creation with artists', function(done) {
    const callback = (error, result) => {
      console.log(result)
      expect(result.statusCode).to.equal(200)
      done()
    }

    var date = new Date()
    date.setDate(date.getDate() + 5)
    test( handler.ticketCreate,
      { body: { title: '테스트 콘서트', start_at: date, end_at: date,
        image: "test", capacity: 100, place: "판교",
        artists: [ { name: '아이유', image: 'iu', }, { name: 'asdf', image: 'qwer' } ],
      } },
      callback
    )
  })

})
