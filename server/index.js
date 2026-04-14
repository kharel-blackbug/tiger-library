// server/index.js
'use strict'
require('dotenv').config()

const express      = require('express')
const helmet       = require('helmet')
const cors         = require('cors')
const compression  = require('compression')
const cookieParser = require('cookie-parser')
const rateLimit    = require('express-rate-limit')
const path         = require('path')
const fs           = require('fs')

const cfg = require('./config')
const { attachLocalDB, attachSheetsDB } = require('./middleware/sheetsMiddleware')
const { optionalAuth } = require('./middleware/auth')

const app    = express()
const isProd = process.env.NODE_ENV === 'production'

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))

// CORS — allow GitHub Pages frontend + localhost in dev
const allowedOrigins = [
  'https://kharel-blackbug.github.io',   // GitHub Pages (your live site)
  'http://localhost:3000',                // local dev
  'http://localhost:5173',                // Vite default port
]
if (cfg.clientUrl && !allowedOrigins.includes(cfg.clientUrl)) {
  allowedOrigins.push(cfg.clientUrl)
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,  // required for cookies cross-origin
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(rateLimit({ windowMs: 60_000, max: 500, message: { error: 'Too many requests' } }))

// ── DB middleware ───────────────────────────────────────────────────────────
app.use(attachLocalDB)
app.use(optionalAuth)
app.use(attachSheetsDB)

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'))
app.use('/api/books',  require('./routes/books'))
app.use('/api/goals',  require('./routes/goals'))
app.use('/api',        require('./routes/index'))

// ── Serve uploaded images ───────────────────────────────────────────────────
app.use('/uploads', express.static(cfg.uploadsDir))

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ ok: true, version: '2.0.0', env: process.env.NODE_ENV || 'development' })
)

// ── Serve built frontend (when deployed as single service, e.g. Railway) ────
const distPath = path.join(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1d' }))
  app.get('*', (req, res) => {
    // Don't intercept /api routes
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' })
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else if (isProd) {
  console.warn('⚠  No dist/ folder. Run: npm run build')
}

// ── Error handler ───────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${err.status || 500} ${err.message}`)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

if (require.main === module) {
  app.listen(cfg.port, () =>
    console.log(`🏔  Tiger's Library → http://localhost:${cfg.port}  [${process.env.NODE_ENV || 'development'}]`)
  )
}

module.exports = { app }
