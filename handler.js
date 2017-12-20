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
module.exports.userRequestPassword = lambda(require('./src/user/request_password'))
module.exports.userAll = lambda(require('./src/user/get_all'))

module.exports.partnerCreate = require('./src/partner/create')
module.exports.partnerGet = lambda(require('./src/partner/get'))
module.exports.partnerSignin = require('./src/partner/signin')
module.exports.partnerDestroy = require('./src/partner/destroy')
module.exports.partnerAll = lambda(require('./src/partner/get_all'))
module.exports.partnerApprove = lambda(require('./src/partner/approve'))
module.exports.partnerTickets = lambda(require('./src/partner/tickets'))

module.exports.ticketCreate = lambda(require('./src/ticket/create'))
module.exports.ticketGet = lambda(require('./src/ticket/get'))
module.exports.ticketUpdate = lambda(require('./src/ticket/update'))
module.exports.ticketDestroy = lambda(require('./src/ticket/destroy'))
module.exports.ticketReserve = lambda(require('./src/ticket/reserve'))
module.exports.ticketAll = lambda(require('./src/ticket/get_all'))
module.exports.ticketStats = lambda(require('./src/ticket/stats'))

module.exports.reservationGet = lambda(require('./src/reservation/get'))
module.exports.reservationCheckin = lambda(require('./src/reservation/checkin'))

module.exports.fileUpload = require('./src/file/upload')

module.exports.subscriptionCreate = lambda(require('./src/subscription/create'))
module.exports.subscriptionDelete = lambda(require('./src/subscription/delete'))
module.exports.subscriptionRenew = lambda(require('./src/subscription/renew'))
