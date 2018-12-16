const axios = require('axios')
const log = console.log

axios.defaults.timeout = 1000*20
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3578.80 Chrome/71.0.3578.80 Safari/537.36'

errors = {
  'NOT200': -1,
  'NORESPONSE': -2,
  'ENOTFOUND': -3,
  'ERR_TLS_CERT_ALTNAME_INVALID': -4,
  'ECONNREFUSED': -5,
  'CERT_HAS_EXPIRED': -6,
  'ECONNRESET': -7,
  'EHOSTUNREACH': -8,
  'ECONNABORTED': -9,
  'DEPTH_ZERO_SELF_SIGNED_CERT': -10,
  'EPROTO': -11,
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE': -12,
}

module.exports = function (db) {
  let batch = 256
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
          let status = -666
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
