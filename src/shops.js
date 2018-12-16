const axios = require('axios')
const log = console.log

// Timeout after 20 seconds
axios.defaults.timeout = 1000*20

// Tell the server we are using Chrome
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3578.80 Chrome/71.0.3578.80 Safari/537.36'

// Load error codes
const errors = require('./errors')

module.exports = function (db) {
  let batch = 128
  let promises = []

  function loadBatch() {
    db.query('SELECT * FROM shops WHERE status = 1 ORDER BY RAND() LIMIT ' + batch, (error, results, fields) => {
      if (error) throw error

      if (results.length == 0) {
        log('ALL DONE')
        return
      }

      for (let i = 0, len = results.length; i < len; i++) {
        let shop = results[i]
        let req = axios.head(shop.name).then(res => {
          process.stdout.write('+')
          db.query('UPDATE shops SET status = 2 WHERE id = ' + shop.id)
        }).catch(err => {
          let status = errors['UNKNOWN']
          if (err.response) {
            status = errors['NOT200']
          } else if (err.request) {
            status = errors['NORESPONSE']
          } else if (errors[err.code] < 0) {
            status = errors[err.code]
          } else {
            if (err.code) {
              log(err.code)
            } else {
              log(err)
            }
          }

          process.stdout.write('-')
          db.query('UPDATE shops SET status = ' + status + ' WHERE id = ' + shop.id)
        })

        promises.push(req)
      }

      Promise.all(promises).then(res => {
        loadBatch()
        process.stdout.write('|')
      })
    })
  }

  loadBatch()
}
