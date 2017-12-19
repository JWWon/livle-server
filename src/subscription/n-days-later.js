'use strict'

module.exports = (n) => {
  let date = new Date()
  date.setDate(date.getDate() + n)
  date.setHours(23, 59, 59)
  return date
}
