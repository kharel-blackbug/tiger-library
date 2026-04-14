// server/middleware/sheetsMiddleware.js
'use strict'

const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs   = require('fs')
const cfg  = require('../config')

// Local SQLite stores: admin credentials, per-user Google Sheet configs, sessions
let _localDB = null

function getLocalDB() {
  if (_localDB) return _localDB
  fs.mkdirSync(path.dirname(cfg.dbPath), { recursive: true })
  const db = new DatabaseSync(cfg.dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      display_name  TEXT,
      role          TEXT DEFAULT 'viewer',
      password_hash TEXT,
      sheet_id      TEXT,
      credentials   TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );
  `)
  _localDB = db
  return db
}

// Attach the local db to every request
function attachLocalDB(req, res, next) {
  req.localDB = getLocalDB()
  next()
}

// If a Google Sheet is configured for this user/session, attach a SheetsDB
async function attachSheetsDB(req, res, next) {
  try {
    if (!req.user) return next()
    const db = req.localDB
    const user = Object.assign({}, db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id))
    if (!user || !user.sheet_id || !user.credentials) return next()

    const { getDB } = require('../services/sheets')
    const creds = JSON.parse(user.credentials)
    req.sheetsDB = getDB(user.sheet_id, creds)
    req.sheetId  = user.sheet_id
    next()
  } catch (e) {
    console.warn('Could not attach SheetsDB:', e.message)
    next()
  }
}

module.exports = { attachLocalDB, attachSheetsDB, getLocalDB }
