const log = console.log

module.exports = function (db) {
  db.query('SELECT COUNT(*) AS count FROM products', (error, results, fields) => {
    if (error) throw error
    log('PRODUCTS COUNT: ' + results[0].count)
  })
  db.end()
}
