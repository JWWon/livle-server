'use strict'

module.exports = function() {
  return new Promise((resolve, reject) =>
    this.getSubscription()
    .then((currSub) => {
      if (!currSub) {
        return reject({ code: 404, err: '구독 정보가 없습니다.' })
      } else {
        if (currSub.paid_at) {
          // 결제된 구독
          currSub.getNext().then((nextSub) => {
            if (!nextSub) {
              return reject({ code: 405, err: '이미 구독을 취소했습니다.' })
            }
            return nextSub.destroy()
          })
        } else {
          // 결제되지 않은 구독
          return currSub.destroy()
        }
      }
    }).then(() => resolve())
    .catch((err) => {
      console.error(err)
      reject(err)
    })
  )
}
