// server/routes/auth.js
'use strict'

const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const { randomUUID: uuid } = require('crypto')
const cfg      = require('../config')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()
const wrap   = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Ensure admin and reader users exist in local DB
function ensureAdmin(db) {
  // Admin user
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role='admin'").get()
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(cfg.adminPassword, 10)
    db.prepare('INSERT INTO users (id,username,display_name,role,password_hash) VALUES (?,?,?,?,?)')
      .run(uuid(), cfg.adminUsername, 'Administrator', 'admin', hash)
    console.log(`Admin user "${cfg.adminUsername}" created`)
  }
  // Reader user
  const existingReader = db.prepare("SELECT id FROM users WHERE role='viewer'").get()
  if (!existingReader) {
    const hash = bcrypt.hashSync(cfg.readerPassword, 10)
    db.prepare('INSERT INTO users (id,username,display_name,role,password_hash) VALUES (?,?,?,?,?)')
      .run(uuid(), cfg.readerUsername, 'Reader', 'viewer', hash)
    console.log(`Reader user "${cfg.readerUsername}" created`)
  }
}

// POST /api/auth/login
router.post('/login', wrap(async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  ensureAdmin(req.localDB)

  const user = Object.assign({}, req.localDB.prepare('SELECT * FROM users WHERE username=?').get(username))
  if (!user.id) return res.status(401).json({ error: 'Invalid credentials' })
  if (!user.password_hash) return res.status(401).json({ error: 'Account not configured' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    cfg.jwtSecret,
    { expiresIn: cfg.jwtExpiry }
  )

  // SameSite=None + Secure required for cross-origin cookies
  // (GitHub Pages frontend → Railway backend)
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  })

  res.json({
    user: { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    token,
  })
}))

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  // Primary: return user info directly from the verified JWT.
  // This works even if the DB has been reset (e.g. Railway ephemeral filesystem).
  // The JWT was signed with our secret so it's trustworthy.
  const user = {
    id:           req.user.id,
    username:     req.user.username,
    display_name: req.user.display_name || req.user.username,
    role:         req.user.role,
    sheet_id:     null,
  }

  // Optionally enrich with sheet_id from DB (non-fatal if DB is gone)
  try {
    const row = req.localDB.prepare('SELECT sheet_id FROM users WHERE id=?').get(req.user.id)
    if (row && row.sheet_id) user.sheet_id = row.sheet_id
  } catch (_) { /* DB unavailable — that's OK */ }

  res.json({ user })
})

// PUT /api/auth/password — admin only
router.put('/password', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { current, next: newPassword } = req.body
  if (!current || !newPassword) return res.status(400).json({ error: 'current and next password required' })
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const user = Object.assign({}, req.localDB.prepare('SELECT password_hash FROM users WHERE id=?').get(req.user.id))
  const valid = await bcrypt.compare(current, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const hash = await bcrypt.hash(newPassword, 10)
  req.localDB.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.user.id)
  res.json({ ok: true })
}))

// PUT /api/auth/sheets — save Google Sheet config for user
router.put('/sheets', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { sheet_id, credentials } = req.body
  if (!sheet_id) return res.status(400).json({ error: 'sheet_id required' })

  // Validate credentials shape
  let creds
  try {
    creds = typeof credentials === 'string' ? JSON.parse(credentials) : credentials
    if (!creds.client_email && !creds.access_token && !creds.api_key) {
      return res.status(400).json({ error: 'credentials must have client_email+private_key or access_token' })
    }
  } catch {
    return res.status(400).json({ error: 'Invalid credentials JSON' })
  }

  req.localDB.prepare('UPDATE users SET sheet_id=?, credentials=? WHERE id=?')
    .run(sheet_id, JSON.stringify(creds), req.user.id)

  // Test the connection
  try {
    const { getDB, clearCache } = require('../services/sheets')
    clearCache(sheet_id)
    const db = getDB(sheet_id, creds)
    await db.ensureStructure()
    res.json({ ok: true, message: 'Google Sheet connected and structure verified' })
  } catch (e) {
    res.status(400).json({ error: `Sheet connection failed: ${e.message}` })
  }
}))

// GET /api/auth/sheets/status
router.get('/sheets/status', requireAuth, wrap(async (req, res) => {
  // Check own config first, then fall back to admin config (for viewer accounts)
  let user = Object.assign({}, req.localDB.prepare('SELECT sheet_id FROM users WHERE id=?').get(req.user.id))
  if (!user.sheet_id) {
    user = Object.assign({}, req.localDB.prepare("SELECT sheet_id FROM users WHERE role='admin' LIMIT 1").get())
  }

  if (!user.sheet_id) return res.json({ connected: false })
  if (!req.sheetsDB) return res.json({ connected: false, sheet_id: user.sheet_id, error: 'Could not connect' })

  try {
    await req.sheetsDB.readAll('Books')
    res.json({ connected: true, sheet_id: user.sheet_id })
  } catch (e) {
    res.json({ connected: false, sheet_id: user.sheet_id, error: e.message })
  }
}))

module.exports = router
