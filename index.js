#!/usr/bin/env node
// Load our arguments
const argv = require('yargs')
  .default({
    task: 'shops'
  })
  .argv

const mysql = require('promise-mysql');

const shops = require('./src/shops')
const products = require('./src/products')

// Check for the task
let task = argv.task

mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'derbscrape'
}).then(db => {
  switch (task) {
    case 'shops':
      shops(db)
      break;
    case 'products':
      products(db)
      break;
    default:
      log('Task not implemented')
  }
})
