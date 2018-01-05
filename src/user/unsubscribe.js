'use strict'

const iamport = require('../config/iamport')

module.exports = function() {
  return new Promise((resolve, reject) =>
    this.getActiveSubscriptions()
    .then(([currSub, nextSub]) => {
      if (!nextSub) {
        return reject({ code: 404, err: '구독 정보가 없습니다.' })
      }
      return iamport.subscribe_customer.delete({
        customer_uid: this.id,
      }).then((res) => nextSub.cancel())
        .then(() => this.update({
          card_name: null,
          last_four_digits: null,
          cancelled_at: new Date(),
        })
        ).then((user) => {
          let userData = user.userData()
          return currSub.getUsedCount()
            .then((count) => {
              let sub = currSub.dataValues
              sub.used = count
              userData.currentSubscription = sub
              return resolve(userData)
            })
        })
    }).catch((err) => {
      console.error(err)
      reject(err)
    })
  )
}
