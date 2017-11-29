module.exports = (statusCode, body, message, headers) => {
  if (message) {
    if (!body) body = { }
    body.message = message
  }

  headers = headers || {}
  headers['Access-Control-Allow-Origin'] = '*'

  return {
    statusCode: statusCode,
    headers: headers,
    body: JSON.stringify(body),
  }
}
