module.exports = (statusCode, body, message) => {
  if(message) {
    if(!body) body = { }
    body.message = message
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(body)
  }
}
