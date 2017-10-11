'use strict';

const expect = require('chai').expect
const handler = require('../handler')

describe('User', function() {
  it('successful creation', function() {
    const context = {
      succeed: function( result ) {
        expect( result.valid ).to.be.true;
        done();
      },
      fail: function() {
        done( new Error( 'never context.fail' ) )
      }
    }

    handler.usersCreate( { body :
      { email: 'test@test.com', password: 'test' }
    }, context )
  })

  it('creation failure when no password', function() {
    const context = {
      succeed: function(result) {
        done( new Error( 'never context.succeed' ) )
      },
      fail: function(err) {
        expect( result.valid ).to.be.true
        done()
      }
    }

    handler.usersCreate( { body: { email: 'test@test.com' } },
      context )
  })
})
