const _ = require('lodash')
const handler = require('../handler')

/**
 * ApiGateway의 작동을 모방하는 클래스
 */
function Gateway() {
  this.headers = {}
}

Gateway.prototype.setAuth = function(token) {
  this.headers.Authorization = token
}

const parseQuery = (path) => {
  const paths = path.split('?')
  if (paths.length === 1) return null
  const querys = paths[1].split('&')
  return _.reduce(querys, (pathParams, q) => {
    const parts = q.split('=')
    const name = parts[0]
    const value = parts[1]
    if (!name || !value) throw new Error('Malformed query string')
    pathParams[name] = value
    return pathParams
  }, { })
}

Gateway.prototype.apiCall = function(method, path, params) {
  let event = {
    headers: this.headers,
    body: params.body ? JSON.stringify(params.body) : null,
    queryStringParameters: parseQuery(path),
    pathParameters: null,
    httpMethod: method,
  }

  const promisify = (func) => (event) =>
    new Promise((resolve, reject) =>
      func(event, {},
        (err, res) => err ? reject(err) : resolve(res)
      )
    )

  const paths = path.split('?')[0].split('/')
  switch (paths[0]) {
    case 'user': {
      switch (paths[1]) {
        case undefined:
          return promisify(handler.userRouter)(event)
        case 'session':
          return promisify(handler.userSignin)(event)
        case 'facebook':
          return promisify(handler.userFacebook)(event)
        case 'password':
          if (method === 'POST') {
            return promisify(handler.userUpdatePassword)(event)
          } else if (method === 'GET') {
            return promisify(handler.userRequestPassword)(event)
          }
        case 'all':
          return promisify(handler.userAll)(event)
        default:
          throw new Error(`Unknown path: ${path}`)
      }
    }
    case 'ticket': {
      switch (paths[1]) {
        case undefined:
          return promisify(handler.ticketRouter)(event)
        case 'all':
          return promisify(handler.ticketAll)(event)
        default: {
          event.pathParameters = { ticketId: paths[1] }
          switch (paths[2]) {
            case undefined: {
              if (method === 'PATCH') {
                return promisify(handler.ticketUpdate)(event)
              } else if (method === 'DELETE') {
                return promisify(handler.ticketDestroy)(event)
              }
            }
            case 'stats':
              return promisify(handler.ticketStats)(event)
            case 'reserve':
              return promisify(handler.ticketReserve)(event)
          }
        }
      }
    }
    case 'subscription': {
      switch (paths[1]) {
        case undefined:
          return promisify(handler.subscriptionRouter)(event)
        case 'restore':
          return promisify(handler.subscriptionRestore)(event)
        default:
          event.pathParameters = { reservationId: paths[1] }
      }
    }
    case 'reservation': {
      if (paths[1]) {
        event.pathParameters = { reservationId: paths[1] }
      }
      return promisify(handler.reservationRouter)(event)
    }
    case 'partner': {
      switch (paths[1]) {
        case undefined:
          return promisify(handler.partnerRouter)(event)
        case 'session':
          return promisify(handler.partnerSignin)(event)
        case 'all':
          return promisify(handler.partnerAll)(event)
        default:
          event.pathParameters = { partnerId: paths[1] }
          switch (paths[2]) {
            case 'approve':
              return promisify(handler.partnerApprove)(event)
            case 'tickets':
              return promisify(handler.partnerTickets)(event)
          }
      }
    }
    case 'file':
      return promisify(handler.fileUpload)(event)
  }
}

module.exports = Gateway
