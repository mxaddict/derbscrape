module.exports = function (db, log) {
  db.query('SELECT COUNT(*) AS count FROM shops WHERE status != 4', (error, results, fields) => {
    if (error) throw error
    log(results)
  })
  db.end()
}
