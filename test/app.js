'use strict'
const axios = require('axios')
axios.defaults.baseURL = 'http://localhost:3000'
function setAuth(token) {
  axios.defaults.headers.common['Authorization'] = token
}

/* Configure env varibles for test */
require('dotenv').config() // .env 파일에서 환경변수 읽어오기
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
    axios.post('/user', {
      email: userEmail,
      password: userPass,
      nickname: 'hi',
      fcmToken: fcmToken
    }).then((res) => {
      const user = res.data
      setAuth(user.token)
      if (user.token) return done()
      done(new Error('Invalid user'))
    }).catch(done)
  }).timeout(10000)

  it('creation failure with not existing email', function(done) {
    axios.post('/user', {
      email: 'nonexsisting@ne.com',
      password: userPass,
      nickname: 'hi'
    }).then((res) => done(new Error('Unexpected success'))
    ).catch((err) => {
      if (err.response.status === 404) return done()
      done(err)
    })
  }).timeout(10000)

  it('creation failure without password', function(done) {
    axios.post('/user', { email: 'abc@abc.com' })
      .then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 400) return done()
        done(err)
      })
  })

  it('creation failure on duplicate email', function(done) {
    axios.post('/user', {
      email: userEmail,
      password: userPass,
    }).then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 403) return done()
        done(err)
      })
  }).timeout(5000)

  it('creation failure on invalid email', function(done) {
    axios.post('/user', { email: 'hahahacom', password: 'hello' })
      .then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 405) return done()
        done(err)
      })
  })

  it('successful retrieval', function(done) {
    axios.get('/user?fcmToken=test')
      .then((res) => {
        console.log(res.data)
        return done()
      }).catch(done)
  })

  it('successful password request', function(done) {
    axios.get(`/user/password?email=${userEmail}`)
      .then((res) => done())
      .catch(done)
  }).timeout(5000)

  xit('successful password update', function(done) {
    // 메일로 토큰을 받아야 업데이트 가능하므로 테스트하지 않음
    axios.post('/user/password', { token: 'token', password: 'newpass' })
      .then((res) => done())
      .catch(done)
  })

  it('successful signin', function(done) {
    axios.post('/user/session', { email: userEmail, password: userPass })
      .then((res) => {
        const user = res.data
        console.log(user)
        setAuth(user.token)
        if (user.token) return done()
        done(new Error('Invalid user'))
      }).catch(done)
  })

  it('successful signin with facebook', function(done) {
    /* 토큰 구하는 곳
     * https://developers.facebook.com/tools/explorer
     */
    axios.post('user/facebook', { accessToken: fbToken })
      .then((res) => done())
      .catch(done)
  }).timeout(5000)
})

let ticket
describe('Ticket', function() {
  it('successful retrieve of list', function(done) {
    axios.get('/ticket')
      .then((res) => {
        const tickets = res.data
        console.log(tickets)
        ticket = tickets[0]
        done()
      }).catch(done)
  })

  it('reservation failure with no subscription', function(done) {
    axios.post(`/ticket/${ticket.id}/reserve`)
      .then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 403) {
          done()
        } else {
          done(err)
        }
      })
  })
})

describe('Subscription', function() {
  it('successful free trial', function(done) {
    axios.post('/subscription', paymentParams)
      .then((res) => {
        const user = res.data
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
      }).catch(done)
  }).timeout(5000)

  it('subscription fails if already subscribing', function(done) {
    axios.post('/subscription', paymentParams)
      .then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 405) {
          return done()
        }
        done(err)
      })
  })

  it('successful reservation', function(done) {
    axios.post(`/ticket/${ticket.id}/reserve`)
      .then((res) => {
        const reservation = res.data
        console.log(reservation)
        done()
      }).catch(done)
  })

  it('reservation failure on duplicate', function(done) {
    axios.post(`/ticket/${ticket.id}/reserve`)
      .then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 405) {
          done()
        } else {
          done(err)
        }
      })
  })

  let reservation
  it('successful retrieval of reservation', function(done) {
    axios.get('/reservation')
      .then((res) => {
        const reservations = res.data
        reservation = reservations[0]
        console.log(reservations)
        done()
      }).catch(done)
  })

  it('checkin failure with invalid checkin code', function(done) {
    axios.post(`/reservation/${reservation.id}/check`, { code: '1234' })
      .then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 403) {
          done()
        } else {
          done(err)
        }
      })
  })

  it('successful cancellation of a reservation', function(done) {
    axios.delete(`/reservation/${reservation.id}`)
      .then((res) => done())
      .catch(done)
  })

  it('successful reservation after a cancellation', function(done) {
    axios.post(`/ticket/${ticket.id}/reserve`)
      .then((res) => {
        const reservation = res.data
        console.log(reservation)
        done()
      }).catch(done)
  }).timeout(5000)

  // TODO successful checkin

  it('successful update of payment information', function(done) {
    axios.patch('/subscription', paymentParams)
      .then((res) => {
        console.log(res.data)
        done()
      }).catch(done)
  })

  it('successful cancellation of a subscription', function(done) {
    axios.delete('/subscription')
      .then((res) => {
        console.log(res.data)
        done()
      }).catch(done)
  })

  it('subscription failure within a valid period after a cancellation',
    function(done) {
      axios.post('/subscription', paymentParams)
        .then((res) => done(new Error('Unexpected success')))
        .catch((err) => {
          if (err.response.status === 405) {
            return done()
          }
          done(err)
        })
    }).timeout(5000)

  it('successful restoration of subscription', function(done) {
    axios.post('/subscription/restore')
      .then((res) => {
        const user = res.data
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
      }).catch(done)
  })

  it('successful cancellation of a subscription', function(done) {
    axios.delete('/subscription')
      .then((res) => {
        const body = res.data
        console.log(body)
        done()
      }).catch(done)
  })
})

describe('Paid subscription', function() {
  it('successful signin', function(done) {
    axios.post('/user/session', {
      email: 'freeTrialDone',
      password: 'fakepassword',
    }).then((res) => {
      const body = res.data
      console.log(body)
      setAuth(body.token)
      if (body.token) return done()
      done(new Error(body))
    }).catch(done)
  })

  it('successful subscription', function(done) {
    axios.post('/subscription', paymentParams)
      .then((res) => {
        const user = res.data
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
      }).catch(done)
  }).timeout(5000)
})

describe('User deletion', function() {
  xit('successful deletion', function(done) {
    // 구독이 만료되지 않아 탈퇴되지 않음
    axios.delete('/user', {
      email: userEmail,
      password: userPass,
    }).then((res) => done())
    .catch(done)
  })

  it('deletion failure while subscription not expired yet', function(done) {
    axios.delete('/user', {
      email: userEmail,
        password: userPass,
    }).then((res) => done(new Error('Unexpected success')))
      .catch((err) => {
        if (err.response.status === 405) {
          done()
        } else {
          done(new Error(err))
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
