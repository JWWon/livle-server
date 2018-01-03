'use strict'

const expect = require('chai').expect
const handler = require('../handler')
require('dotenv').config() // .env 파일에서 환경변수 읽어오기

let authToken = ''

const test = (func, params, callback) => {
  func({
    headers: { Authorization: authToken },
    body: JSON.stringify(params.body),
    queryStringParameters: params.query, pathParameters: params.path,
  }, {}, callback)
}

const userEmail = 'test@test.com'
const userPass = 'test'

describe('User', function() {
  it('successful creation', function(done) {
    const callback = (error, result) => {
      if (error) done(error)
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      authToken = res.token
      expect(result).to.exist
      done()
    }

    test(handler.userCreate,
      { body: { email: userEmail, password: userPass, nickname: 'hi' } },
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
      if (error) done(error)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userGet,
      { },
      callback
    )
  })

  it('successful password request', function(done) {
    const callback = (error, result) => {
      if (error) done(error)
      console.log(result)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userRequestPassword,
      { query: { email: userEmail } },
      callback
    )
  }).timeout(5000)

  /*
  it('successful password update', function(done) {
    const callback = (error, result) => {
      if(error) done(error)
      console.log(result)
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userUpdatePassword,
      { body: { token: 'test', password: 'new' } },
      callback
    )
  })
  */

  it('successful signin', function(done) {
    const callback = (error, result) => {
      if (error) return done(error)
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      authToken = res.token
      done()
    }

    test( handler.userSignin,
      { body: { email: userEmail, password: userPass } },
      callback
    )
  })

  it('successful signin with facebook', function(done) {
    const callback = (error, result) => {
      const code = result.statusCode
      if (code === 200 || code === 201) {
        return done()
      }
      return done(new Error(`invalid statusCode ${code}`))
    }

    /* 토큰 구하는 곳
     * https://developers.facebook.com/tools/explorer
     */
    test( handler.userFacebook,
      { body: { accessToken: process.env.FB_TOKEN } },
      callback
    )
  }).timeout(5000)
})

let ticket
describe('Ticket', function() {
  it('successful retrieve of list', function(done) {
    const callback = (error, result) => {
      if (error) return done(error)
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
      if (result.statusCode === 403) {
        done()
      } else {
        done(new Error(result.body))
      }
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
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.subscriptionCreate,
      { body:
        {
          cardNumber: cardNumber,
          expiry: expiry,
          birth: birth,
          password: password,
        },
      }, callback
    )
  }).timeout(5000)

  it('subscription fails if already subscribing', function(done) {
    const callback = (error, result) => {
      if (error) return done(error)
      expect(result.statusCode).to.equal(405)
      done()
    }

    test( handler.subscriptionCreate,
      { body:
        {
          cardNumber: cardNumber,
          expiry: expiry,
          birth: birth,
          password: password,
        },
      }, callback
    )
  })

  it('successful reservation', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.ticketReserve,
      { path: { ticketId: ticket.id } },
      callback
    )
  })

  it('reservation failure on duplicate', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 405) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.ticketReserve,
      { path: { ticketId: ticket.id } },
      callback
    )
  })

  let reservation
  it('successful retrieval of reservation', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        const reservations = JSON.parse(result.body)
        reservation = reservations[0]
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.reservationGet,
      { },
      callback
    )
  })

  it('checkin failure with invalid checkin code', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 403) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.reservationCheckin,
      { path: { reservationId: reservation.id }, body: { code: '1234' } },
      callback
    )
  })

  it('successful cancellation of a reservation', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.reservationCancel,
      { path: { reservationId: reservation.id } },
      callback
    )
  })

  it('successful reservation after a cancellation', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.ticketReserve,
      { path: { ticketId: ticket.id } },
      callback
    )
  })

  it('successful cancellation of a subscription', function(done) {
    const callback = (error, result) => {
      if (error) return done(error)
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
  let partnerId

  it('successful creation', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      partnerId = res.id
      done()
    }

    test( handler.partnerCreate,
      { body:
        { username: 'test@test.com', company: 'test', password: 'test' },
      },
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

  it('successful approval', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerApprove,
      { path: { partnerId: partnerId } },
      callback
    )
  })

  it('successful deletion', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerDestroy,
      { body: { username: 'test@test.com', password: 'test' } },
      callback )
  })

  it('successfully get user from session', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerGet,
      { }, callback)
  })

  it('successfully get users list', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.userAll,
      { }, callback)
  })

  it('successfully get partners list', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerAll,
      { }, callback)
  })

  it('successfully get one\'s own concerts list', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.partnerTickets,
      { path: { partnerId: 1 } }, callback)
    // Under a condition that the admin account's id is 1
  })

  it('successfully get concerts list', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.ticketAll,
      { }, callback)
  })

  it('successfully get ticket details', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        //const body = JSON.parse(result.body)
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.ticketStats,
      { path: { ticketId: 1 } }, callback)
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
      if (error) return done(error)
      expect(result.statusCode).to.equal(200)
      done()
    }

    let date = new Date()
    date.setDate(date.getDate() + 5)
    test( handler.ticketCreate,
      { body: { title: '테스트 콘서트', start_at: date, end_at: date,
        image: 'test', capacity: 100, place: '판교' } },
      callback
    )
  })

  let ticketId
  it('successful creation with artists', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      ticketId = res.id
      done()
    }

    let date = new Date()
    date.setDate(date.getDate() + 5)
    test( handler.ticketCreate,
      { body: { title: '테스트 콘서트', start_at: date, end_at: date,
        image: 'test', capacity: 100, place: '판교',
        artists: [
          { name: '아이유', image: 'iu' },
          { name: 'asdf', image: 'qwer' },
        ],
      } },
      callback
    )
  })

  it('successful update', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      const res = JSON.parse(result.body)
      ticketId = res.id
      done()
    }

    test( handler.ticketUpdate,
      { path: { ticketId: ticketId },
        body: {
          title: '테스트 콘서트 업데이트',
          image: 'test2', capacity: 50, place: '판교',
          artists: [
            { id: 1, name: '아이유2', image: 'iu' },
            { name: 'hello', image: 'qwer' },
            { name: '수란', image: 'suran' },
          ],
        },
      },
      callback
    )
  })

  it('successful deletion', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.ticketDestroy,
      { path: { ticketId: ticketId } },
      callback
    )
  })
})

/*
 *
 * 구독 업데이트
 *
 */

describe('Subscription renew', function() {
  it('successful renewal', function(done) {
    const callback = (error, result) => {
      expect(result.statusCode).to.equal(200)
      done()
    }

    test( handler.subscriptionRenew,
      {},
      callback
    )
  })
})
