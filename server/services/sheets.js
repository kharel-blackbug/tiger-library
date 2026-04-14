// server/services/sheets.js
// Google Sheets is THE database. All reads/writes go here.
'use strict'

const { google } = require('googleapis')
const cfg = require('../config')

// Column layouts (must match sheet headers exactly)
const COLS = {
  Books: ['id','title','author','genre','type','year','nation','description',
          'is_base','is_sikkim','cover_url','rating','status','review','review_date',
          'total_pages','current_page','date_started','date_finished','added_by','added_at'],
  Quotes:   ['id','book_id','text','page_ref','added_by','added_at'],
  Wishlist: ['id','title','author','genre','priority','note','added_by','added_at'],
  Goals:    ['id','name','description','target_date','status','book_ids',
             'owner','created_at','updated_at'],
  Users:    ['id','username','display_name','role','password_hash','created_at'],
}

// Build an auth client from stored credentials
function makeAuth(credentials) {
  // credentials: { client_email, private_key } from a GCP service account
  // OR: { access_token } from OAuth2
  if (credentials.client_email && credentials.private_key) {
    return new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }
  if (credentials.access_token) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: credentials.access_token })
    return auth
  }
  throw new Error('Invalid credentials format')
}

// Parse a sheet row array into an object using column layout
function parseRow(cols, row) {
  const obj = {}
  cols.forEach((col, i) => { obj[col] = row[i] ?? null })
  return obj
}

// Convert object to row array
function toRow(cols, obj) {
  return cols.map(col => obj[col] ?? '')
}

class SheetsDB {
  constructor(spreadsheetId, credentials) {
    this.spreadsheetId = spreadsheetId
    this.auth = makeAuth(credentials)
    this.api = google.sheets({ version: 'v4', auth: this.auth })
  }

  // ── Ensure all tabs and headers exist ─────────────────────────────────
  async ensureStructure() {
    const meta = await this.api.spreadsheets.get({ spreadsheetId: this.spreadsheetId })
    const existing = meta.data.sheets.map(s => s.properties.title)
    const requests = []

    for (const [tab, cols] of Object.entries(COLS)) {
      if (!existing.includes(tab)) {
        requests.push({ addSheet: { properties: { title: tab } } })
      }
    }

    if (requests.length) {
      await this.api.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests },
      })
    }

    // Write headers for any empty sheets
    for (const [tab, cols] of Object.entries(COLS)) {
      const range = `${tab}!A1:${String.fromCharCode(65 + cols.length - 1)}1`
      const res = await this.api.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId, range,
      })
      if (!res.data.values || !res.data.values[0] || !res.data.values[0][0]) {
        await this.api.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: { values: [cols] },
        })
      }
    }
  }

  // ── Generic read all rows from a tab ──────────────────────────────────
  async readAll(tab) {
    const cols = COLS[tab]
    const range = `${tab}!A2:${String.fromCharCode(65 + cols.length - 1)}9999`
    const res = await this.api.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId, range,
    })
    const rows = res.data.values || []
    return rows.filter(r => r[0]).map(r => parseRow(cols, r))
  }

  // ── Find a row number by ID (1-indexed including header) ──────────────
  async findRowNum(tab, id) {
    const res = await this.api.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:A`,
    })
    const rows = res.data.values || []
    const idx = rows.findIndex(r => r[0] === id)
    return idx > 0 ? idx + 1 : null  // +1 for 1-index, already skips header at idx=0
  }

  // ── Upsert (insert or update by id) ───────────────────────────────────
  async upsert(tab, obj) {
    const cols = COLS[tab]
    const row = toRow(cols, obj)
    const rowNum = await this.findRowNum(tab, obj.id)

    if (rowNum) {
      const range = `${tab}!A${rowNum}:${String.fromCharCode(65 + cols.length - 1)}${rowNum}`
      await this.api.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      })
    } else {
      const range = `${tab}!A:${String.fromCharCode(65 + cols.length - 1)}`
      await this.api.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      })
    }
    return obj
  }

  // ── Delete a row by id ────────────────────────────────────────────────
  async deleteById(tab, id) {
    const rowNum = await this.findRowNum(tab, id)
    if (!rowNum) return false

    // Get sheet id (gid) for the tab
    const meta = await this.api.spreadsheets.get({ spreadsheetId: this.spreadsheetId })
    const sheet = meta.data.sheets.find(s => s.properties.title === tab)
    if (!sheet) return false

    await this.api.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId:    sheet.properties.sheetId,
              dimension:  'ROWS',
              startIndex: rowNum - 1,
              endIndex:   rowNum,
            },
          },
        }],
      },
    })
    return true
  }

  // ── Bulk seed (for base books) ─────────────────────────────────────────
  async bulkAppend(tab, objects) {
    const cols = COLS[tab]
    const rows = objects.map(o => toRow(cols, o))
    const range = `${tab}!A:${String.fromCharCode(65 + cols.length - 1)}`
    await this.api.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    })
  }
}

// Cache per spreadsheet+credentials combo
const cache = new Map()

function getDB(spreadsheetId, credentials) {
  const key = spreadsheetId
  if (!cache.has(key)) {
    cache.set(key, new SheetsDB(spreadsheetId, credentials))
  }
  return cache.get(key)
}

function clearCache(spreadsheetId) {
  cache.delete(spreadsheetId)
}

module.exports = { SheetsDB, getDB, clearCache, COLS }
