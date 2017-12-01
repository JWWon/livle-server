'use strict'

const lambda = (func) => {
  return (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    const respond = (code, data) => {
      callback(null, {
        statusCode: code,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(data)
      })
    }

    let params = {}
    params.body = event.body && JSON.parse(event.body)
    //params.path =
    params.query = event.queryStringParameters
    params.auth = event.headers && event.headers.Authorization
    params.path = event.pathParameters

    func(params, respond)
  }
}

module.exports.userCreate = lambda(require('./src/user/create'))
module.exports.userGet = lambda(require('./src/user/get'))
module.exports.userDestroy = lambda(require('./src/user/destroy'))
module.exports.userSignin = lambda(require('./src/user/signin'))

module.exports.partnerCreate = require('./src/partner/create')
module.exports.partnerGet = require('./src/partner/get')
module.exports.partnerSignin = require('./src/partner/signin')
module.exports.partnerDestroy = require('./src/partner/destroy')

module.exports.ticketCreate = lambda(require('./src/ticket/create'))
module.exports.ticketGet = lambda(require('./src/ticket/get'))
module.exports.ticketReserve = lambda(require('./src/ticket/reserve'))

module.exports.reservationGet = lambda(require('./src/reservation/get'))
module.exports.reservationCheckin = lambda(require('./src/reservation/checkin'))

module.exports.fileUpload = require('./src/file/upload')

module.exports.subscriptionCreate = lambda(require('./src/subscription/create'))
module.exports.subscriptionGet = lambda(require('./src/subscription/get'))
module.exports.subscriptionDelete = lambda(require('./src/subscription/delete'))
