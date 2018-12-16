module.exports = function (db, log) {
  let limit = 1
  db.query('SELECT * FROM shops WHERE status != 2 LIMIT ' + limit, (error, results, fields) => {
    if (error) throw error
    for (let i = 0, len = results.length; i < len; i++) {
      let shop = results[i]
      log(shop)
    }
  })
  db.end()
}
