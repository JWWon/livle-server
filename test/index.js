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

    test(handler.userCreate,
      { email: "test@test.com", password: "test" },
      context)
  })

  it('creation failure when no password', function(done) {
    const context = {
      succeed: function(result) {
        expect(result.statusCode).to.equal(400)
        done()
      },
      fail: function(err) {
        done( new Error( 'never context.fail' ) )
      }
    }

    test( handler.userCreate,
      { email: 'abc@abc.com' },
      context
    )
  })

  it('creation failure on duplicate email', function(done) {
    const context = {
      succeed: function(result) {
        expect(result.statusCode).to.equal(403)
        done()
      },
      fail: function(err) {
        done( new Error( 'never context.fail' ) )
      }
    }

    test( handler.userCreate,
      { email: 'test@test.com', password: 'testtest' },
      context
    )
  })

  it('creation failure on invalid email', function(done) {
    const context = {
      succeed: function(result) {
        expect(result.statusCode).to.equal(405)
        done()
      },
      fail: function(err) {
        done( new Error( 'never context.fail' ) )
      }
    }

    test( handler.userCreate,
      { email: 'hahahacom', password: 'hello' },
      context
    )
  })

  it('successful deletion', function(done) {
    const context = {
      succeed: function(result) {
        expect(result.statusCode).to.equal(200)
        done()
      },
      fail: function(err) {
        done( new Error( 'never context.fail' ) )
      }
    }

    test( handler.userDestroy,
      { email: "test@test.com", password: "test" },
      context
    )
  })

})
