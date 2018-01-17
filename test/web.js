const Gateway = require('./mock-gateway')
const gateway = new Gateway()

// TODO remove those
const handler = require('../handler')
const expect = require('chai').expect

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

describe('Partner', function() {
  let partnerId

  it('successful creation', function(done) {
    gateway.apiCall('POST', 'partner', {
      body: { username: 'test@test.com', company: 'test', password: 'test' },
    }).then((result) => {
      if (result.statusCode === 200) {
        const partner = JSON.parse(result.body)
        partnerId = partner.id
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('successful signin', function(done) {
    gateway.apiCall('POST', 'partner/session', {
      body: { username: 'admin@livle.kr', password: 'livle' }
    }).then((result) => {
      const partner = JSON.parse(result.body)
      partnerId = partner.id
      gateway.setAuth(partner.token)
      if (partner.token) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('successful approval', function(done) {
    gateway.apiCall('POST', `partner/${partnerId}/approve`, { })
      .then((result) => {
        if (result.statusCode === 200) {
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successful deletion', function(done) {
    gateway.apiCall('DELETE', 'partner', {
      body: { username: 'test@test.com', password: 'test' }
    }).then((result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('successfully get partner from session', function(done) {
    gateway.apiCall('GET', 'partner', {
    }).then((result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('successfully get users list', function(done) {
    gateway.apiCall('GET', 'user/all', {})
      .then((result) => {
        const users = JSON.parse(result.body)
        if (result.statusCode === 200) {
          console.log(users)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successfully get partners list', function(done) {
    gateway.apiCall('GET', 'partner/all', {})
      .then((result) => {
        const partners = JSON.parse(result.body)
        if (result.statusCode === 200) {
          console.log(partners)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  }).timeout(5000)

  it('successfully get one\'s own concerts list', function(done) {
    // Under a condition that the admin account's id is 1
    gateway.apiCall('GET', `partner/1/tickets`, {})
      .then((result) => {
        if (result.statusCode === 200) {
          const body = JSON.parse(result.body)
          console.log(body)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successfully get concerts list', function(done) {
    gateway.apiCall('GET', 'ticket/all' , {})
      .then((result) => {
        if (result.statusCode === 200) {
          const body = JSON.parse(result.body)
          console.log(body)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successfully get ticket details', function(done) {
    gateway.apiCall('GET', 'ticket/1/stats' , {})
      .then((result) => {
        if (result.statusCode === 200) {
          // const body = JSON.parse(result.body)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })
})

xdescribe('File', function() {
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

xdescribe('Ticket', function() {
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
