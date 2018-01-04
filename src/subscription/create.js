'use strict'

const User = require('../user/user')
const FreeTrial = require('../free_trial')

module.exports = (params, respond) => {
  const data = params.body
  if ( !(
    data && data.cardNumber && data.expiry && data.birth && data.password
  ) ) {
    return respond(400, '결제 정보가 누락되었습니다.')
  }

  const token = params.auth
  return User.fromToken(token)
    .then((user) => {
      if (user.isSubscribing()) return respond(405, '이미 구독 중입니다.')
      if (!user.free_trial_id) {
        return new Promise((resolve, reject) =>
          FreeTrial.check(data.cardNumber)
          .then((available) => {
            if (!available) return respond(406, '이미 체험한 카드입니다.')
            return resolve(user)
          })
        )
      }
      return user
    }).then((user) =>
      user.subscribe(data).then(([currSub, nextSub]) => {
        let userData = user.userData()
        userData.currentSubscription = currSub.dataValues
        userData.currentSubscription.used = 0
        userData.nextSubscription = nextSub.dataValues
        userData.nextSubscription.used = 0
        return respond(200, userData)
      }).catch((err) => {
        switch (err.code) {
          case 402: // 결제 실패 또는 구독 정보 업데이트 실패
          case 403: // 결제 정보 인증 실패
            respond(err.code, err.err)
          default:
            console.error(err)
            respond(500, err)
        }
      })
    ).catch((err) => {
      console.error(err)
      respond(401, '로그인이 필요합니다.')
    })
}
