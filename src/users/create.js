'use strict';

module.exports = (event, callback) => {
  console.log(event)
  const data = JSON.parse(event.body)

  data.updatedAt = new Date().getTime();

  return dbdbdb(params, (error, data) => {
    if (error) {
      callback(error);
    }
    callback(error, params.Item);
  });
};
