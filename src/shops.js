const axios = require('axios')
const log = console.log

axios.defaults.timeout = 1000*30

module.exports = function (db) {
  let batch = 1000
  let promises = []

  function loadBatch() {
    let counts = {
      bad: 0,
      good: 0
    }

    db.query('SELECT * FROM shops WHERE status = 1 LIMIT ' + batch, (error, results, fields) => {
      if (error) throw error

      if (results.length == 0) {
        log('ALL DONE')
        return
      }

      for (let i = 0, len = results.length; i < len; i++) {
        let shop = results[i]
        let req = axios.get(shop.name).then(res => {
          if (res.status >= 200 && res.status < 300) {
            process.stdout.write('+')
            counts.good++
            //log('SHOP: ' + shop.id + ' STATUS: OK')
            db.query('UPDATE shops SET status = 2 WHERE id = ' + shop.id)
          } else {
            process.stdout.write('-')
            counts.bad++
            //log('SHOP: ' + shop.id + ' STATUS: ' + res.status + '|' + res.statusText)
            db.query('UPDATE shops SET status = -1 WHERE id = ' + shop.id)
          }
        }).catch(err => {
          process.stdout.write('-')
          counts.bad++
          //log('SHOP: ' + shop.id + ' STATUS: DEAD')
          db.query('UPDATE shops SET status = -2 WHERE id = ' + shop.id)
        })

        promises.push(req)
      }

      Promise.all(promises).then(res => {
        loadBatch()
        log('=')
        log('BATCH DONE | GOOD: ' + counts.good + ' BAD: ' + counts.bad)
      })
    })
  }

  loadBatch()
}
