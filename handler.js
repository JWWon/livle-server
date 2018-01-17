'use strict'

const lambda = (func) => {
  return (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    const respond = (code, data) => {
      if (code >= 500) console.error(data)
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
    params.httpMethod = event.httpMethod

    func(params, respond)
  }
}

module.exports.userRouter = lambda(require('./src/user/router'))
module.exports.userSignin = lambda(require('./src/user/signin'))
module.exports.userFacebook = lambda(require('./src/user/facebook'))
module.exports.userRequestPassword = lambda(require('./src/user/request_password'))
module.exports.userUpdatePassword = lambda(require('./src/user/update_password'))
module.exports.userAll = lambda(require('./src/user/get_all'))

module.exports.partnerRouter = lambda(require('./src/partner/router'))
module.exports.partnerSignin = lambda(require('./src/partner/signin'))
module.exports.partnerAll = lambda(require('./src/partner/get_all'))
module.exports.partnerApprove = lambda(require('./src/partner/approve'))
module.exports.partnerTickets = lambda(require('./src/partner/tickets'))

module.exports.ticketRouter = lambda(require('./src/ticket/router'))
module.exports.ticketUpdate = lambda(require('./src/ticket/update'))
module.exports.ticketDestroy = lambda(require('./src/ticket/destroy'))
module.exports.ticketReserve = lambda(require('./src/ticket/reserve'))
module.exports.ticketAll = lambda(require('./src/ticket/get_all'))
module.exports.ticketStats = lambda(require('./src/ticket/stats'))

module.exports.reservationRouter = lambda(require('./src/reservation/router'))
module.exports.reservationGet = lambda(require('./src/reservation/get'))
module.exports.reservationCancel = lambda(require('./src/reservation/cancel'))

module.exports.fileUpload = lambda(require('./src/file/upload'))

module.exports.subscriptionRouter = lambda(require('./src/subscription/router'))
module.exports.subscriptionRestore = lambda(require('./src/subscription/restore'))
module.exports.subscriptionLimit = lambda(require('./src/subscription/limit'))

module.exports.subscriptionRenew = lambda(require('./schedule/subscription_renewer'))
module.exports.noshowChecker = lambda(require('./schedule/noshow_checker'))
module.exports.userDestroyer = lambda(require('./schedule/user_destroyer'))
