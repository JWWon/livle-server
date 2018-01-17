'use strict'

const User = require('../src/user/user')
const handler = require('../handler')

require('dotenv').config() // .env 파일에서 환경변수 읽어오기
const userEmail = process.env.TESTER_EMAIL

describe('Subscription renew', function() {
  it('successful renewal', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    const startOfToday = () => {
      let date = new Date()
      date.setHours(0, 0, 0)
      return date
    }
    const thirtyDaysFromNow = () => {
      let date = new Date()
      date.setDate(date.getDate() + 30)
      date.setHours(23, 59, 59)
      return date
    }
    handler.subscriptionRenew({}, {}, callback)
  }).timeout(10000)
})

const Ticket = require('../src/ticket/ticket')
const Reservation = require('../src/reservation/reservation')
describe('Noshow check', function() {
  it('successful checked', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }

    const createTestTicket = () => {
      const nHoursAgo = (n) => {
        let date = new Date()
        date.setHours(date.getHours() - n)
        return date
      }
      return Ticket.create({
        partner_id: 1,
        title: 'Imminent ticket',
        start_at: nHoursAgo(2),
        end_at: nHoursAgo(1),
        image: 'fakeimage',
        checkin_code: '1234',
        capacity: 10,
        place: 'fakeplace',
      })
    }

    User.findOne({ where: { email: userEmail } })
      .then((user) => createTestTicket().then((ticket) =>
        user.subscriptionFor(ticket.start_at).then((sub) =>
          Reservation.reserve(ticket, sub)))
      ).then(() => handler.noshowChecker({}, {}, callback))
  })
})

describe('Destroy user data', function() {
  it('successful destroyal', function(done) {
    const callback = (error, result) => {
      if (result.statusCode === 200) {
        done()
      } else {
        done(new Error(result.body))
      }
    }
    handler.userDestroyer({}, {}, callback)
  })
})
