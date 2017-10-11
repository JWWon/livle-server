'use strict';

const expect = require('chai').expect
const handler = require('../handler')

const test = (func, params, context) => {
  func({ body: JSON.stringify(params) }, context)
}

describe('User', function() {
  it('successful creation', function(done) {
    const context = {
      succeed: function(result) {
        expect(result).to.exist
        done()
      },
      fail: function() {
        done( new Error( 'never context.fail' ) )
      }
    }

    test(handler.usersCreate,
      { email: "test@test.com", password: "test" },
      context)
  })

  it('creation failure when no password', function(done) {
    const context = {
      succeed: function(result) {
        done(new Error('never context.succeed'))
      },
      fail: function(err) {
        //console.log(err)
        done()
      }
    }

    test( handler.usersCreate,
      { email: 'test@test.com' },
      context
    )
  })
})
