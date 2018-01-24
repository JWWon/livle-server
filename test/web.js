'use strict'
const axios = require('axios')
axios.defaults.baseURL = 'http://localhost:3000'
function setAuth(token) {
  axios.defaults.headers.common['Authorization'] = token
}

describe('Partner', function() {
  let partnerId

  it('successful creation', function(done) {
    axios.post('/partner', {
      username: 'test5@test.com',
      company: 'test',
      password: 'test',
    },).then((res) => {
      const partner = res.data
      partnerId = partner.id
      done()
    }).catch(done)
  })

  it('successful signin', function(done) {
    axios.post('/partner/session', {
      username: 'admin@livle.kr',
      password: 'livle',
    }).then((res) => {
      const partner = res.data
      partnerId = partner.id
      setAuth(partner.token)
      if (partner.token) {
        done()
      } else {
        done(new Error('Missing token'))
      }
    }).catch(done)
  })

  it('successful approval', function(done) {
    axios.post(`/partner/${partnerId}/approve`)
      .then((res) => done())
      .catch(done)
  })

  it('successful deletion', function(done) {
    axios.delete('/partner', {
      data: { username: 'test@test.com', password: 'test' },
    }).then((res) => done())
      .catch(done)
  })

  it('successfully get partner from session', function(done) {
    axios.get('/partner')
      .then((res) => done())
      .catch(done)
  })
})

describe('Listing', function() {
  it('successfully get users list', function(done) {
    axios.get('/user/list?page=1')
      .then((res) => {
        const users = res.data
        console.log(users)
        done()
      }).catch(done)
  })

  it('successfully find users by email', function(done) {
    axios.get('/user/list?page=1&email=livle')
      .then((res) => {
        const users = res.data
        console.log(users)
        done()
      }).catch(done)
  })

  it('successfully get partners list', function(done) {
    axios.get('/partner/list?page=1')
      .then((res) => {
        const partners = res.data
        console.log(partners)
        done()
      }).catch(done)
  })

  it('successfully find partners by company and approval state', function(done) {
    axios.get('/partner/list?page=1&company=iv&approved=true')
      .then((res) => {
        const partners = res.data
        console.log(partners)
        done()
      }).catch(done)
  })

  it('successfully get one\'s own concerts list', function(done) {
    // Under a condition that the admin account's id is 1
    axios.get('/partner/1/tickets?page=1')
      .then((res) => {
        const concerts = res.data
        console.log(concerts)
        done()
      }).catch(done)
  })

  it('successfully get concerts list', function(done) {
    axios.get('/ticket/list?page=1')
      .then((res) => {
        const concerts = res.data
        console.log(concerts)
        done()
      }).catch(done)
  })

  it('successfully find concerts by title and state', function(done) {
    axios.get('/ticket/list?page=1&title=a&state=end')
      .then((res) => {
        const concerts = res.data
        console.log(concerts)
        done()
      }).catch(done)
  })
})

describe('Partner actions', function() {
  it('successfully get ticket details', function(done) {
    axios.get('/ticket/1/stats')
      .then((res) => done())
      .catch(done)
  })

  it('successfully modify limit of a subscription', function(done) {
    axios.patch('/subscription/1/limit', { limit: 3 })
    .then((res) => {
      const s = res.data
      console.log(s)
      done()
    }).catch(done)
  })

  it('successfully release suspension of an user', function(done) {
    axios.delete('/user/1/suspend')
      .then((res) => {
        const user = res.data
        console.log(user)
        done()
      }).catch(done)
  })
})

describe('File', function() {
  it('successful signing', function(done) {
    axios.get('/file')
      .then((res) => done())
      .catch(done)
  })
})

describe('Ticket', function() {
  it('successful creation', function(done) {
    let date = new Date()
    date.setDate(date.getDate() + 5)
    axios.post('/ticket', {
      title: '테스트 콘서트',
      start_at: date,
      end_at: date,
      image: 'test',
      capacity: 100,
      place: '판교'
    }).then((res) => done())
    .catch(done)
  })

  let ticketId
  it('successful creation with artists', function(done) {
    let date = new Date()
    date.setDate(date.getDate() + 5)
    axios.post('/ticket', {
      title: '테스트 콘서트',
      start_at: date,
      end_at: date,
      image: 'test', capacity: 100, place: '판교',
      artists: [
        { name: '아이유', image: 'iu' },
        { name: 'asdf', image: 'qwer' },
      ],
    }).then((res) => {
      const ticket = res.data
      ticketId = ticket.id
      done()
    }).catch(done)
  })

  it('successful update', function(done) {
    axios.patch(`/ticket/${ticketId}`, {
      title: '테스트 콘서트 업데이트',
      image: 'test2', capacity: 50, place: '판교',
      artists: [
        { id: 1, name: '아이유2', image: 'iu' },
        { name: 'hello', image: 'qwer' },
        { name: '수란', image: 'suran' },
      ],
    }).then((res) => {
      const ticket = res.data
      ticketId = ticket.id
      done()
    }).catch(done)
  })

  it('successful deletion', function(done) {
    axios.delete(`/ticket/${ticketId}`)
      .then((res) => done())
      .catch(done)
  })
})
