// Libraries
const faker = require('faker')
const _ = require('lodash')
const Ticket = require('../../src/ticket/ticket')
const Artist = require('../../src/ticket/artist')

// Helper functions
const getNextWeekOf = (date) => {
  date.setDate(date.getDate() + 7)
  return date
}

// Constants
const TODAY = new Date()
const WEEK_AFTER = getNextWeekOf(TODAY)
const PLACES = [
  '잠실 종합운동장 주경기장',
  '가로수길',
  '홍대 놀이터 앞',
  '경희대학교 평화의전당',
  '인천 문학경기장',
  '삼성 코엑스',
  '판교 스타트업캠퍼스 컨퍼런스홀',
]
const IMAGES = [
  'http://i.ebayimg.com/images/g/5OcAAOSwTuJYo4Jm/s-l1600.jpg',
  'https://cdn.londonandpartners.com/visit/london-organisations/alexandra-palace/92923-640x360-alexandra-palace-gig-640.jpg',
  'https://static.pexels.com/photos/154147/pexels-photo-154147.jpeg',
  'https://media.timeout.com/images/102503695/image.jpg',
]
const ARTIST_IMAGES = [
  'http://clipart-library.com/images/qiBoqa5dT.jpg',
  'https://www.thefamouspeople.com/images/ariana-grande-min.jpg',
  'http://www.trendingtopmost.com/wp-content/uploads/2016/12/Rihanna-3.jpg',
  'https://i.pinimg.com/736x/6e/63/d7/6e63d71df99b4904c403c285039fd286--shawn-mendez-celebrities.jpg',
]
const TICKET_SIZE = 16 // Count of tickets to add
const MAX = {
  VACANCIES: 20,
  RUNTIME: 4,
  ARTISTS: 6,
}

const hoursAfter = (date) => {
  date.setHours(date.getHours() + faker.random.number(MAX.RUNTIME))
  return date
}

const randomCode = (digits) => digits > 0 ?
  parseInt(Math.random() * 10).toString() + randomCode(digits - 1) : ''

const tickets = _.times(TICKET_SIZE, () => {
  const startAt = faker.date.between(TODAY, WEEK_AFTER)
  return Ticket.create({
    partner_id: 1,
    title: faker.name.title(),
    start_at: startAt,
    end_at: hoursAfter(startAt),
    image: _.sample(IMAGES),
    checkin_code: randomCode(4),
    capacity: 20, // faker.random.number(MAX.VACANCIES),
    place: _.sample(PLACES),
    video_id: 'T9fKvVGBBy4',
  })
})

module.exports = () => Promise.all(tickets).then((tickets) => {
    console.log('Tickets created')
    const creatingArtists = _.map(tickets, (t) =>
      new Promise((resolve, reject) => {
        const artists = _.times(
          faker.random.number({ min: 1, max: MAX.ARTISTS }),
          () => Artist.create({
            ticket_id: t.id,
            name: faker.name.findName(),
            image: _.sample(ARTIST_IMAGES),
          })
        )
        return Promise.all(artists)
          .then(() => resolve())
          .catch((err) => reject(err))
      })
    )
    return Promise.all(creatingArtists)
  })
