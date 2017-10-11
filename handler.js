'use strict';

const usersCreate = require('./users/create');

const resHeaders = {
  "Access-Control-Allow-Origin" : "*"
}

module.exports.usersCreate = (event, context, callback) => {
  usersCreate(event, (error, result) => {
    const response = {
      statusCode: 200,
      headers: resHeaders,
      body: JSON.stringify(result),
    }

    context.succeed(response);
  })
}
