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

module.exports = () => {
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
        const users = JSON.parse(result.body)
        if (result.statusCode === 200) {
          console.log(users)
          done()
        } else {
          done(new Error(result.body))
        }
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
        if (result.statusCode === 200) {
          const body = JSON.parse(result.body)
          console.log(body)
          done()
        } else {
          done(new Error(result.body))
        }
      }

      test( handler.partnerTickets,
        { path: { partnerId: 1 } }, callback)
      // Under a condition that the admin account's id is 1
    })

    it('successfully get concerts list', function(done) {
      const callback = (error, result) => {
        if (result.statusCode === 200) {
          const body = JSON.parse(result.body)
          console.log(body)
          done()
        } else {
          done(new Error(result.body))
        }
      }

      test( handler.ticketAll,
        { }, callback)
    })

    it('successfully get ticket details', function(done) {
      const callback = (error, result) => {
        if (result.statusCode === 200) {
          // const body = JSON.parse(result.body)
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
}
