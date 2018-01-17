'use strict'

const Gateway = require('./mock-gateway')
const gateway = new Gateway()
require('dotenv').config() // .env 파일에서 환경변수 읽어오기

// 테스트에 사용되는 환경변수들
const fbToken = process.env.FB_TOKEN
const userEmail = process.env.TESTER_EMAIL
const userPass = 'test'
const fcmToken = process.env.TESTER_FCM_TOKEN
const paymentParams = {
  cardNumber: process.env.CARD_NUMBER,
  expiry: process.env.EXPIRY,
  birth: process.env.BIRTH,
  password: process.env.PASSWORD,
}

describe('User', function() {
  it('successful creation', function(done) {
    gateway.apiCall('POST', 'user', {
      body: {
        email: userEmail,
        password: userPass,
        nickname: 'hi',
        fcmToken: fcmToken },
    }).then((result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        gateway.setAuth(body.token)
        if (body.token) return done()
      }
      done(new Error(body))
    })
  }).timeout(10000)

  it('creation failure with not existing email', function(done) {
    gateway.apiCall('POST', 'user', {
      body: {
        email: 'nonexsisting@ne.com',
        password: userPass,
        nickname: 'hi' },
    }).then((result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 404) {
        done()
      } else {
        done(new Error(body))
      }
    })
  }).timeout(10000)

  it('creation failure when no password', function(done) {
    gateway.apiCall('POST', 'user', {
      body: { email: 'abc@abc.com' },
    }).then((result) => {
      if (result.statusCode === 400) return done()
      done(new Error(result))
    })
  })

  it('creation failure on duplicate email', function(done) {
    gateway.apiCall('POST', 'user', {
      body: { email: userEmail, password: userPass },
    }).then((result) => {
      if (result.statusCode === 403) return done()
      done(new Error(result))
    })
  }).timeout(5000)

  it('creation failure on invalid email', function(done) {
    gateway.apiCall('POST', 'user', {
      body: { email: 'hahahacom', password: 'hello' },
    }).then((result) => {
      if (result.statusCode === 405) return done()
      done(new Error(result))
    })
  })

  it('successful retrieval', function(done) {
    gateway.apiCall('GET', 'user?fcmToken=test', {})
      .then((result) => {
        const body = JSON.parse(result.body)
        if (result.statusCode === 200) {
          console.log(body)
          return done()
        }
        done(new Error(body))
      })
  })

  it('successful password request', function(done) {
    gateway.apiCall('GET', `user/password?email=${userEmail}`, {})
      .then((result) => {
        if (result.statusCode === 200) return done()
        done(new Error(result))
      })
  }).timeout(5000)

  xit('successful password update', function(done) {
    // 메일로 토큰을 받아야 업데이트 가능하므로 테스트하지 않음
    gateway.apiCall('POST', 'user/password', {
      body: { token: 'token', password: 'newpass' },
    }).then((result) => {
      if (result.statusCode === 200) {
        return done()
      }
      done(new Error(result.body))
    })
  })

  it('successful signin', function(done) {
    gateway.apiCall('POST', 'user/session', {
      body: { email: userEmail, password: userPass },
    }).then((result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        gateway.setAuth(body.token)
        if (body.token) return done()
      }
      done(new Error(body))
    })
  })

  it('successful signin with facebook', function(done) {
    /* 토큰 구하는 곳
     * https://developers.facebook.com/tools/explorer
     */
    gateway.apiCall('POST', 'user/facebook', {
      body: { accessToken: fbToken },
    }).then((result) => {
      const code = result.statusCode
      if (code === 200 || code === 201) {
        return done()
      }
      return done(new Error(code))
    })
  }).timeout(5000)
})

let ticket
describe('Ticket', function() {
  it('successful retrieve of list', function(done) {
    gateway.apiCall('GET', 'ticket', {
    }).then((result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        ticket = body[0]
        return done()
      }
      done(new Error(body))
    })
  })

  it('reservation failure with no subscription', function(done) {
    gateway.apiCall('POST', `ticket/${ticket.id}/reserve`, {
    }).then((result) => {
      if (result.statusCode === 403) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })
})

describe('Subscription', function() {
  it('successful free trial', function(done) {
    gateway.apiCall('POST', 'subscription', { body: paymentParams })
      .then((result) => {
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
      })
  }).timeout(5000)

  it('subscription fails if already subscribing', function(done) {
    gateway.apiCall('POST', 'subscription', { body: paymentParams })
      .then((result) => {
        if (result.statusCode === 405) {
          return done()
        }
        done(new Error(result.body))
      })
  })

  it('successful reservation', function(done) {
    gateway.apiCall('POST', `ticket/${ticket.id}/reserve`, {})
      .then((result) => {
        if (result.statusCode === 200) {
          const reservation = JSON.parse(result.body)
          console.log(reservation)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('reservation failure on duplicate', function(done) {
    gateway.apiCall('POST', `ticket/${ticket.id}/reserve`, {})
      .then((result) => {
        if (result.statusCode === 405) {
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  let reservation
  it('successful retrieval of reservation', function(done) {
    gateway.apiCall('GET', 'reservation', {})
      .then((result) => {
        if (result.statusCode === 200) {
          const reservations = JSON.parse(result.body)
          reservation = reservations[0]
          console.log(reservations)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('checkin failure with invalid checkin code', function(done) {
    gateway.apiCall('POST', `reservation/${reservation.id}/check`,
      { code: '1234' }).then((result) => {
        if (result.statusCode === 403) {
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successful cancellation of a reservation', function(done) {
    gateway.apiCall('DELETE', `reservation/${reservation.id}`, {})
      .then((result) => {
        if (result.statusCode === 200) {
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successful reservation after a cancellation', function(done) {
    gateway.apiCall('POST', `ticket/${ticket.id}/reserve`, {})
      .then((result) => {
        if (result.statusCode === 200) {
          const reservation = JSON.parse(result.body)
          console.log(reservation)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  }).timeout(5000)

  // TODO successful checkin

  it('successful update of payment information', function(done) {
    gateway.apiCall('PATCH', 'subscription', { body: paymentParams })
      .then((result) => {
        const body = JSON.parse(result.body)
        if (result.statusCode === 200) {
          console.log(body)
          done()
        } else {
          done(new Error(body))
        }
      })
  })

  it('successful cancellation of a subscription', function(done) {
    gateway.apiCall('DELETE', 'subscription', { })
      .then((result) => {
        if (result.statusCode === 200) {
          const body = JSON.parse(result.body)
          console.log(body)
          done()
        } else {
          done(new Error(body))
        }
      })
  })

  it('subscription failure within a valid period after a cancellation',
    function(done) {
      gateway.apiCall('POST', 'subscription', { body: paymentParams })
        .then((result) => {
          if (result.statusCode === 405) {
            done()
          } else {
            done(new Error(result.body))
          }
        })
    }).timeout(5000)

  it('successful restoration of subscription', function(done) {
    gateway.apiCall('POST', 'subscription/restore', { })
      .then((result) => {
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
      })
  })

  it('successful cancellation of a subscription', function(done) {
    gateway.apiCall('DELETE', 'subscription', { })
      .then((result) => {
        const body = JSON.parse(result.body)
        if (result.statusCode === 200) {
          console.log(body)
          done()
        } else {
          done(new Error(body))
        }
      })
  })
})

describe('Paid subscription', function() {
  it('successful signin', function(done) {
    gateway.apiCall('POST', 'user/session', {
      body: { email: 'freeTrialDone', password: 'fakepassword' },
    }).then((result) => {
      const body = JSON.parse(result.body)
      if (result.statusCode === 200) {
        console.log(body)
        gateway.setAuth(body.token)
        if (body.token) return done()
      }
      done(new Error(body))
    })
  })

  it('successful subscription', function(done) {
    gateway.apiCall('POST', 'subscription', { body: paymentParams })
      .then((result) => {
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
      })
  }).timeout(5000)
})

describe('User deletion', function() {
  xit('successful deletion', function(done) {
    // 구독이 만료되지 않아 탈퇴되지 않음
    gateway.apiCall('DELETE', 'user', {
      body: {
        email: userEmail,
        password: userPass,
      },
    }).then((result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('deletion failure while subscription not expired yet', function(done) {
    gateway.apiCall('DELETE', 'user', {
      body: {
        email: userEmail,
        password: userPass,
      },
    }).then((result) => {
      if (result.statusCode === 405) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })
})

describe('Push notification', function() {
  it('successful push notification', function(done) {
    require('../src/send-push')(fcmToken, 'Test push')
      .then((res) => {
        console.log(res)
        done()
      }).catch((err) => done(err))
  })
})
