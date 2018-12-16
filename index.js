#!/usr/bin/env node
// Load our arguments
const argv = require('yargs')
  .default({
    task: 'shops'
  })
  .argv

const mysql = require('mysql');
const log = console.log

const shops = require('./src/shops')
const products = require('./src/products')

const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'derbscrape'
});

db.connect()

// Check for the task
let task = argv.task

switch (task) {
  case 'shops':
    shops(db, log)
    break;
  case 'products':
    products(db, log)
    break;
  default:
    log('Task not implemented')
}
