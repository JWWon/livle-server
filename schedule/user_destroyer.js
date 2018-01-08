'use strict'

const _ = require('lodash')
const Op = require('sequelize').Op
const User = require('../src/user/user')
const uuid = require('uuid/v1')
const flag = 'deleted' // 삭제가 완료되었음을 표시하기 위해 사용

// 이 날짜 이전에 탈퇴한 회원의 정보를 삭제
const deleteBefore = () => {
  let date = new Date()
  date.setDate(date.getDate() - 7)
  return date
}

const clear = (user) =>
  user.update({
    email: uuid(),
    nickname: null,
    password: flag,
    password_reset_token: null,
    facebook_token: null,
  })

module.exports = (params, respond) => {
  console.log(`User destroyer runs at ${new Date()}`)
  User.findAll({
    where: {
      password: { [Op.ne]: flag },
      deleted_at: { [Op.lt]: deleteBefore() },
    },
    paranoid: false,
  }).then((users) => Promise.all(_.map(users, clear)))
    .then(() => {
      console.log('User destroyer successfully completed')
      respond(200)
    }).catch((err) => {
      console.error('Error destroying users')
      console.error(err)
      respond(500)
    })
}
