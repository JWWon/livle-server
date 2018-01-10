'use strict'

const expect = require('chai').expect
const handler = require('../handler')
require('dotenv').config() // .env 파일에서 환경변수 읽어오기

// 테스트에 사용되는 환경변수들
const fbToken = process.env.FB_TOKEN
const cardNumber = process.env.CARD_NUMBER
const expiry = process.env.EXPIRY
const birth = process.env.BIRTH
const password = process.env.PASSWORD
const userEmail = process.env.TESTER_EMAIL
const userPass = 'test'

let authToken = ''

const test = (func, params, callback) => {
  func({
    headers: { Authorization: authToken },
    body: JSON.stringify(params.body),
    queryStringParameters: params.query,
    pathParameters: params.path,
    httpMethod: params.httpMethod,
  }, {}, callback)
}


describe('User', function() {
  it('successful creation', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        authToken = body.token
        if (authToken) return done()
      }
      done(new Error(body))
    }

    test(handler.userRouter,
      {
        httpMethod: 'POST',
        body: { email: userEmail, password: userPass, nickname: 'hi' },
      },
      callback)
  }).timeout(5000)

  it('creation failure with not existing email', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 404) {
        done()
      } else {
        done(new Error(body))
      }
    }

    test(handler.userRouter,
      {
        httpMethod: 'POST',
        body: { email: 'nonexsisting@ne.com', password: userPass, nickname: 'hi' },
      },
      callback)
  }).timeout(5000)

  it('creation failure when no password', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 400) return done()
      done(new Error(result))
    }

    test( handler.userCreate,
      { body: { email: 'abc@abc.com' } },
      callback
    )
  })

  it('creation failure on duplicate email', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 403) return done()
      done(new Error(result))
    }

    test( handler.userCreate,
      { body: { email: userEmail, password: userPass } },
      callback
    )
  }).timeout(5000)

  it('creation failure on invalid email', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 405) return done()
      done(new Error(result))
    }

    test( handler.userCreate,
      { body: { email: 'hahahacom', password: 'hello' } },
      callback
    )
  })

  it('successful retrieval', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        return done()
      }
      done(new Error(body))
    }

    test( handler.userGet,
      { },
      callback
    )
  })

  it('successful password request', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) return done()
      done(new Error(result))
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
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        authToken = body.token
        if (authToken) return done()
      }
      done(new Error(body))
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
      return done(new Error(code))
    }

    /* 토큰 구하는 곳
     * https://developers.facebook.com/tools/explorer
     */
    test( handler.userFacebook,
      { body: { accessToken: fbToken } },
      callback
    )
  }).timeout(5000)
})

let ticket
describe('Ticket', function() {
  it('successful retrieve of list', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        ticket = body[0]
        return done()
      }
      done(new Error(body))
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
  it('successful free trial', function(done) {
    const callback = (error, result) => {
      const user = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(user)
        if (!user.currentSubscription || !user.nextSubscription) {
          return done(new Error('Failed to return subscription data'))
        }
        const from = new Date(user.currentSubscription.from)
        const to = new Date(user.currentSubscription.to)
        const daysBetween = (to - from) / 1000 / 60 / 60 / 24
        if (daysBetween < 30) {
          return done(new Error('Subscription shorter than 30 days'))
        }
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
        const reservation = JSON.parse(result.body)
        console.log(reservation)
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
        console.log(reservations)
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
        const reservation = JSON.parse(result.body)
        console.log(reservation)
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

  // TODO successful checkin

  it('successful update of payment information', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        done()
      } else {
        done(new Error(body))
      }
    }

    test( handler.subscriptionUpdate,
      { body:
        {
          cardNumber: cardNumber,
          expiry: expiry,
          birth: birth,
          password: password,
        },
      }, callback )
  })

  it('successful cancellation of a subscription', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        const body = JSON.parse(result.body)
        console.log(body)
        done()
      } else {
        done(new Error(body))
      }
    }

    test( handler.subscriptionCancel,
      { },
      callback
    )
  })

  it('subscription failure within a valid period after a cancellation',
    function(done) {
      const callback = (error, result) => {
        if (result.statusCode === 405) {
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

  it('successful restoration of subscription', function(done) {
    const callback = (error, result) => {
      const user = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(user)
        if (!user.currentSubscription || !user.nextSubscription) {
          return done(new Error('Failed to return subscription data'))
        }
        const from = new Date(user.currentSubscription.from)
        const to = new Date(user.currentSubscription.to)
        const daysBetween = (to - from) / 1000 / 60 / 60 / 24
        if (daysBetween < 30) {
          return done(new Error('Subscription shorter than 30 days'))
        }
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.subscriptionRestore,
      { }, callback)
  })

  it('successful cancellation of a subscription', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        done()
      } else {
        done(new Error(body))
      }
    }

    test( handler.subscriptionCancel,
      { },
      callback
    )
  })
})

describe('Paid subscription', function() {
  it('successful signin', function(done) {
    const callback = (error, result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        authToken = body.token
        if (authToken) return done()
      }
      done(new Error(body))
    }

    test( handler.userSignin,
      { body: { email: 'freeTrialDone', password: 'fakepassword' } },
      callback
    )
  })

  it('successful subscription', function(done) {
    const callback = (error, result) => {
      const user = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(user)
        if (!user.currentSubscription || !user.nextSubscription) {
          return done(new Error('Failed to return subscription data'))
        }
        const from = new Date(user.currentSubscription.from)
        const to = new Date(user.currentSubscription.to)
        const daysBetween = (to - from) / 1000 / 60 / 60 / 24
        if (daysBetween < 30) {
          return done(new Error('Subscription shorter than 30 days'))
        }
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
})

describe('User deletion', function() {
  it('deletion failure while subscription not expired yet', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 405) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    test( handler.userDestroy,
      { body: { email: userEmail, password: userPass } },
      callback
    )
  })
})

require('./web')()

require('./schedule')()
