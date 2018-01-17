const Gateway = require('./mock-gateway')
const gateway = new Gateway()

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
      body: { username: 'admin@livle.kr', password: 'livle' },
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
      body: { username: 'test@test.com', password: 'test' },
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
})

describe('Partner actions', function() {
  it('successfully get users list', function(done) {
    gateway.apiCall('GET', 'user/all', {})
      .then((result) => {
        if (result.statusCode === 200) {
          const users = JSON.parse(result.body)
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
        if (result.statusCode === 200) {
          const partners = JSON.parse(result.body)
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
    gateway.apiCall('GET', 'ticket/all', {})
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
    gateway.apiCall('GET', 'ticket/1/stats', {})
      .then((result) => {
        if (result.statusCode === 200) {
          // const body = JSON.parse(result.body)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })

  it('successfully modify limit of a subscription', function(done) {
    gateway.apiCall('PATCH', 'subscription/1/limit', {
      body: { limit: 3 },
    }).then((result) => {
        if (result.statusCode === 200) {
          const s = JSON.parse(result.body)
          console.log(s)
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })
})

describe('File', function() {
  it('successful signing', function(done) {
    gateway.apiCall('GET', 'file', {})
      .then((result) => {
        if (result.statusCode === 200) {
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })
})

describe('Ticket', function() {
  it('successful creation', function(done) {
    let date = new Date()
    date.setDate(date.getDate() + 5)
    gateway.apiCall('POST', 'ticket', { body: {
      title: '테스트 콘서트',
      start_at: date,
      end_at: date,
      image: 'test',
      capacity: 100,
      place: '판교' },
    }).then((result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  let ticketId
  it('successful creation with artists', function(done) {
    let date = new Date()
    date.setDate(date.getDate() + 5)
    gateway.apiCall('POST', 'ticket', { body: {
      title: '테스트 콘서트',
      start_at: date,
      end_at: date,
      image: 'test', capacity: 100, place: '판교',
      artists: [
        { name: '아이유', image: 'iu' },
        { name: 'asdf', image: 'qwer' },
      ],
    } }).then((result) => {
      if (result.statusCode === 200) {
        const ticket = JSON.parse(result.body)
        ticketId = ticket.id
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('successful update', function(done) {
    gateway.apiCall('PATCH', `ticket/${ticketId}`, { body: {
      title: '테스트 콘서트 업데이트',
      image: 'test2', capacity: 50, place: '판교',
      artists: [
        { id: 1, name: '아이유2', image: 'iu' },
        { name: 'hello', image: 'qwer' },
        { name: '수란', image: 'suran' },
      ],
    } }).then((result) => {
      if (result.statusCode === 200) {
        const ticket = JSON.parse(result.body)
        ticketId = ticket.id
        done()
      } else {
        done(new Error(result.body))
      }
    })
  })

  it('successful deletion', function(done) {
    gateway.apiCall('DELETE', `ticket/${ticketId}`, {})
      .then((result) => {
        if (result.statusCode === 200) {
          done()
        } else {
          done(new Error(result.body))
        }
      })
  })
})
