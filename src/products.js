const axios = require('axios')
const log = console.log

// Timeout after 20 seconds
axios.defaults.timeout = 1000*60

// Tell the server we are using Chrome
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3578.80 Chrome/71.0.3578.80 Safari/537.36'

// Load error codes
const errors = require('./errors')

module.exports = function (db) {
  async function loadProducts(shop) {
    let getMore = true
    let page = 1
    let limit = 250
    let status = 4

    // Mark as processing
    db.query('UPDATE shops SET status = 3 WHERE id = ' + shop.id)

    // Keep loading the products pages
    while (getMore) {
      let url = shop.name + '/products.json?limit=' + limit + '&page=' + page
      let products = []

      try {
        let res = await axios.get(url)

        if (res.data) {
          try {
            if (res.data.products) {
              products = res.data.products

              for (let i = 0, len = products.length; i < len; i++) {
                let product = products[i]
                let variant = product.variants[0]
                let image = product.images[0]

                db.query(
                  "INSERT INTO products SET " +
                  "shopify_pid = " + db.escape(product.id) + ", " +
                  "shop_id = " + db.escape(shop.id) + ", " +
                  "title = " + db.escape(product.title) + ", " +
                  "product_type = " + db.escape(product.product_type) + ", " +
                  "link = " + db.escape(shop.name + "/products/" + product.handle + "?variant=" + variant.id) + ", " +
                  "tags = " + db.escape(JSON.stringify(product.tags)) + ", " +
                  "image = " + db.escape((image ? image.src : '')) + ", " +
                  "price = " + db.escape(variant.price) + ", " +
                  "raw_data = " + db.escape(JSON.stringify(product)) + ", " +
                  "created_at = NOW(), " +
                  "updated_at = NOW()"
                )

                process.stdout.write('+')
              }
            } else {
              // Not a shopify page
              process.stdout.write('-')
              status = errors['NOTSHOPIFY']
            }
          } catch (e) {
            log(res.status)
            log(e)
            log(url)
            // Not a shopify page
            process.stdout.write('-')
            status = errors['NOTSHOPIFY']
          }
        } else {
          // What the hell went wrong?
          process.stdout.write('-')
          status = errors['UNKNOWN']
        }
      } catch (e) {
        if (page === 1) {
          // Not a shopify page
          process.stdout.write('-')
          status = errors['NOTSHOPIFY']
        }
      }

      if (products.length < limit) {
        getMore = false
      } else {
        page++
        process.stdout.write('P')
      }
    }

    // Mark as done
    process.stdout.write('|')
    db.query('UPDATE shops SET status = ' + status + ' WHERE id = ' + shop.id)
  }

  function loadBatch() {
    db.query('SELECT * FROM shops WHERE status = 2 ORDER BY RAND() LIMIT 1', async (error, results, fields) => {
      if (error) throw error

      if (results.length == 0) {
        log('ALL DONE')
        return
      }

      let shop = results[0]

      await loadProducts(shop)

      loadBatch()
    })
  }

  loadBatch()
}
