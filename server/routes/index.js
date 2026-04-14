// server/routes/index.js — quotes, wishlist, scan, stats
'use strict'

const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const { randomUUID: uuid } = require('crypto')
const dayjs    = require('dayjs')
const cfg      = require('../config')
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth')
const { scanBookImage, lookupBook } = require('../services/vision')

const router = express.Router()
const wrap   = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const noSheets = res => res.status(503).json({ error: 'Google Sheet not configured' })

// ── Multer for image uploads ───────────────────────────────────────────────
fs.mkdirSync(cfg.uploadsDir, { recursive: true })
const storage = multer.diskStorage({
  destination: cfg.uploadsDir,
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|png|webp|heic)/.test(file.mimetype)
    cb(ok ? null : new Error('Only JPEG/PNG/WebP images allowed'), ok)
  },
})

// ── QUOTES ────────────────────────────────────────────────────────────────
router.get('/books/:id/quotes', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const all = await req.sheetsDB.readAll('Quotes')
  res.json({ quotes: all.filter(q => q.book_id === req.params.id) })
}))

router.post('/books/:id/quotes', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { text, page_ref } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })
  const quote = {
    id:       uuid(),
    book_id:  req.params.id,
    text:     text.trim(),
    page_ref: page_ref || '',
    added_by: req.user.username,
    added_at: dayjs().toISOString(),
  }
  await req.sheetsDB.upsert('Quotes', quote)
  res.status(201).json({ quote })
}))

router.delete('/quotes/:id', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  await req.sheetsDB.deleteById('Quotes', req.params.id)
  res.json({ ok: true })
}))

// ── WISHLIST ──────────────────────────────────────────────────────────────
router.get('/wishlist', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  res.json({ items: await req.sheetsDB.readAll('Wishlist') })
}))

router.post('/wishlist', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { title, author, genre, priority, note } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const item = {
    id:       uuid(),
    title:    title.trim(),
    author:   author || '',
    genre:    genre  || '',
    priority: priority || 'medium',
    note:     note || '',
    added_by: req.user.username,
    added_at: dayjs().toISOString(),
  }
  await req.sheetsDB.upsert('Wishlist', item)
  res.status(201).json({ item })
}))

router.delete('/wishlist/:id', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  await req.sheetsDB.deleteById('Wishlist', req.params.id)
  res.json({ ok: true })
}))

router.post('/wishlist/:id/move', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const items = await req.sheetsDB.readAll('Wishlist')
  const item  = items.find(i => i.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })

  const now = dayjs().toISOString()
  const book = {
    id:          uuid(),
    title:       item.title,
    author:      item.author,
    genre:       item.genre || 'Non-Fiction',
    type:        'Non-Fiction',
    year:        '',
    nation:      '',
    description: '',
    is_base:     '0',
    is_sikkim:   '0',
    cover_url:   '',
    rating:      '',
    status:      'shelf',
    review:      '',
    review_date: '',
    total_pages: '',
    current_page:'',
    date_started:'',
    date_finished:'',
    added_by:    req.user.username,
    added_at:    now,
  }
  await req.sheetsDB.upsert('Books', book)
  await req.sheetsDB.deleteById('Wishlist', item.id)
  res.json({ book })
}))

// ── SCAN — image → books ──────────────────────────────────────────────────
router.post('/scan', requireAuth, requireAdmin, upload.array('images', 10), wrap(async (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'No images uploaded' })

  const results = []
  for (const file of req.files) {
    try {
      const books = await scanBookImage(file.path)
      results.push({ file: file.originalname, books, error: null })
    } catch (e) {
      results.push({ file: file.originalname, books: [], error: e.message })
    } finally {
      // Clean up temp file
      fs.unlink(file.path, () => {})
    }
  }

  const allBooks = results.flatMap(r => r.books)
  res.json({ results, total_found: allBooks.length })
}))

// POST /api/scan/lookup — text lookup
router.post('/scan/lookup', requireAuth, wrap(async (req, res) => {
  const { title, author } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const book = await lookupBook(title, author)
  res.json({ book })
}))

// ── STATS ─────────────────────────────────────────────────────────────────
router.get('/stats', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)

  const [books, wishlist, goals] = await Promise.all([
    req.sheetsDB.readAll('Books'),
    req.sheetsDB.readAll('Wishlist'),
    req.sheetsDB.readAll('Goals'),
  ])

  const total   = books.length
  const read    = books.filter(b => b.status === 'read').length
  const reading = books.filter(b => b.status === 'reading').length
  const shelf   = books.filter(b => b.status === 'shelf').length
  const rated   = books.filter(b => b.rating).length
  const sikkim  = books.filter(b => b.is_sikkim === '1').length
  const avgRat  = rated > 0
    ? (books.reduce((s, b) => s + (parseFloat(b.rating) || 0), 0) / rated).toFixed(1)
    : null

  // Pages read
  const pagesRead = books
    .filter(b => b.status === 'read' && b.total_pages)
    .reduce((s, b) => s + (parseInt(b.total_pages) || 0), 0)

  // Genre breakdown
  const genres = {}
  books.forEach(b => { if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1 })

  // Books read per month (last 12 months)
  const monthlyRead = {}
  books.filter(b => b.date_finished).forEach(b => {
    const month = dayjs(b.date_finished).format('YYYY-MM')
    monthlyRead[month] = (monthlyRead[month] || 0) + 1
  })

  // Active goals progress
  const goalsProgress = goals.filter(g => g.status === 'active').map(g => {
    let bookIds = []
    try { bookIds = JSON.parse(g.book_ids || '[]') } catch {}
    const completed = bookIds.filter(id => {
      const b = books.find(b => b.id === id)
      return b && b.status === 'read'
    }).length
    return { ...g, total: bookIds.length, completed }
  })

  res.json({
    total, read, reading, shelf, rated, sikkim, avgRat, pagesRead,
    wishlistCount: wishlist.length,
    goalsActive:   goals.filter(g => g.status === 'active').length,
    genres:        Object.entries(genres).sort((a, b) => b[1] - a[1]),
    monthlyRead:   Object.entries(monthlyRead).sort(),
    goalsProgress,
    streakDays:    calculateStreak(books),
  })
}))

function calculateStreak(books) {
  const dates = books
    .filter(b => b.date_finished)
    .map(b => dayjs(b.date_finished).format('YYYY-MM-DD'))
    .sort()
    .reverse()
  if (!dates.length) return 0
  // Days since last finish
  const last = dayjs(dates[0])
  const diff = dayjs().diff(last, 'day')
  return diff <= 30 ? Math.max(0, 30 - diff) : 0  // simplified streak
}

module.exports = router
