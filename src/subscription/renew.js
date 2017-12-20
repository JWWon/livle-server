'use strict'

const _ = require('lodash')
const Op = require('sequelize').Op
const User = require('../user/user')

const tomorrow = () => {
  let date = new Date()
  date.setHours(24, 0, 0)
  return date
}

const getStartOfToday = () => {
  let date = new Date()
  date.setHours(0, 0, 0)
  return date
}

const renew = (user) => new Promise((resolve, reject) =>
  user.pay().then((user) => {
    console.log(`${user.email} 유저 재구독 성공`)
    return resolve()
  }).catch((err) => {
    console.error(`${user.email} 유저 재구독 실패`)
    if (user.valid_by < startOfToday) {
      // 어제까지 유효한 경우 = n번째 결제 실패 ( n > 1 )
      return user.cancelReservationsAfter(user.valid_by)
        .then(() => {
          console.log(`${user.email} 유저의 예약이 취소됨`)
          return resolve()
        })
    } else {
      // 오늘까지 유효한 경우 = 첫번째 결제 실패
      // TODO 푸시 알림
      return resolve()
    }
  })
)

module.exports = (params, respond) => {
  const startOfToday = getStartOfToday()

  User.findAll({
    where: {
      last_four_digits: { [Op.ne]: null },
      cancelled_at: null,
      // 유효기간이 오늘 혹은 그 이전까지인 구독유저들 찾기
      valid_by: { [Op.lt]: tomorrow() }
    }
  }).then((users) => {
    const renewal = _.map(users, (user) => renew(user))
    return Promise.all(renewal)
  }).then(() => respond(200))
    .catch((err) => { console.error(err) })
}
