'use strict'

module.exports.userCreate = require('./src/user/create')
module.exports.userGet = require('./src/user/get')
module.exports.userDestroy = require('./src/user/destroy')
module.exports.userSignin = require('./src/user/signin')

module.exports.partnerCreate = require('./src/partner/create')
module.exports.partnerGet = require('./src/partner/get')
module.exports.partnerSignin = require('./src/partner/signin')
module.exports.partnerDestroy = require('./src/partner/destroy')

module.exports.ticketCreate = require('./src/ticket/create')
module.exports.ticketGet = require('./src/ticket/get')

module.exports.fileUpload = require('./src/file/upload')
