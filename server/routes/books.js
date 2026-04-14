// server/routes/books.js
'use strict'

const express = require('express')
const { randomUUID: uuid } = require('crypto')
const dayjs   = require('dayjs')
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth')

const router = express.Router()
const wrap   = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function noSheets(res) {
  return res.status(503).json({ error: 'Google Sheet not configured. Go to Settings → Connect Sheet.' })
}

// GET /api/books — list all, with optional filters
router.get('/', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  let books = await req.sheetsDB.readAll('Books')

  const { search, genre, sikkim, status, sort = 'title', order = 'asc' } = req.query

  if (search) {
    const q = search.toLowerCase()
    books = books.filter(b =>
      ['title','author','genre','nation','description'].some(f => (b[f]||'').toLowerCase().includes(q))
    )
  }
  if (genre  && genre !== 'all')  books = books.filter(b => b.genre === genre)
  if (sikkim) books = books.filter(b => b.is_sikkim === '1' || b.is_sikkim === true)
  if (status) books = books.filter(b => b.status === status)

  const dir = order === 'desc' ? -1 : 1
  books.sort((a, b) => {
    const av = (a[sort] || '').toString().toLowerCase()
    const bv = (b[sort] || '').toString().toLowerCase()
    return av < bv ? -dir : av > bv ? dir : 0
  })

  res.json({ books, total: books.length })
}))

// GET /api/books/:id
router.get('/:id', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const books = await req.sheetsDB.readAll('Books')
  const book  = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Book not found' })
  res.json({ book })
}))

// POST /api/books — admin only
router.post('/', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { title, author, genre, type, year, nation, description, is_sikkim, cover_url, total_pages } = req.body
  if (!title || !author) return res.status(400).json({ error: 'title and author required' })

  const book = {
    id:          uuid(),
    title:       title.trim(),
    author:      author.trim(),
    genre:       genre || 'Non-Fiction',
    type:        type  || 'Non-Fiction',
    year:        year  || '',
    nation:      nation || '',
    description: description || '',
    is_base:     req.body.is_base ? '1' : '0',
    is_sikkim:   is_sikkim ? '1' : '0',
    cover_url:   cover_url || '',
    rating:      '',
    status:      '',
    review:      '',
    review_date: '',
    total_pages: total_pages || '',
    current_page:'',
    date_started:'',
    date_finished:'',
    added_by:    req.user.username,
    added_at:    dayjs().toISOString(),
  }

  await req.sheetsDB.upsert('Books', book)
  res.status(201).json({ book })
}))

// PUT /api/books/:id — admin only
router.put('/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const books = await req.sheetsDB.readAll('Books')
  const existing = books.find(b => b.id === req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updated = { ...existing, ...req.body, id: req.params.id }
  await req.sheetsDB.upsert('Books', updated)
  res.json({ book: updated })
}))

// DELETE /api/books/:id — admin only, base books protected
router.delete('/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const books = await req.sheetsDB.readAll('Books')
  const book  = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Not found' })
  if (book.is_base === '1') return res.status(403).json({ error: 'Base catalogue books are protected' })

  await req.sheetsDB.deleteById('Books', req.params.id)
  res.json({ ok: true })
}))

// PUT /api/books/:id/status — auth required (viewers can update their status)
router.put('/:id/status', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { rating, status } = req.body
  const books = await req.sheetsDB.readAll('Books')
  const book  = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Not found' })

  const updated = {
    ...book,
    rating: rating != null ? String(rating) : book.rating,
    status: status != null ? status : book.status,
  }
  await req.sheetsDB.upsert('Books', updated)
  res.json({ book: updated })
}))

// PUT /api/books/:id/review — auth required
router.put('/:id/review', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { review } = req.body
  const books = await req.sheetsDB.readAll('Books')
  const book  = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Not found' })

  const updated = { ...book, review: review || '', review_date: dayjs().toISOString() }
  await req.sheetsDB.upsert('Books', updated)
  res.json({ book: updated })
}))

// PUT /api/books/:id/progress — auth required
router.put('/:id/progress', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { total_pages, current_page, date_started, date_finished } = req.body
  const books = await req.sheetsDB.readAll('Books')
  const book  = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Not found' })

  const updated = {
    ...book,
    total_pages:   total_pages   != null ? String(total_pages)   : book.total_pages,
    current_page:  current_page  != null ? String(current_page)  : book.current_page,
    date_started:  date_started  != null ? date_started          : book.date_started,
    date_finished: date_finished != null ? date_finished         : book.date_finished,
  }
  // Auto-set status to 'read' when finished
  if (date_finished && !book.date_finished) updated.status = 'read'
  // Auto-set status to 'reading' when started
  if (date_started && !book.date_started && !date_finished) updated.status = 'reading'

  await req.sheetsDB.upsert('Books', updated)
  res.json({ book: updated })
}))

// POST /api/books/bulk — bulk import (from image scan) — admin only
router.post('/bulk', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { books } = req.body
  if (!Array.isArray(books) || !books.length) return res.status(400).json({ error: 'books array required' })

  const now = dayjs().toISOString()
  const prepared = books.map(b => ({
    id:          uuid(),
    title:       (b.title || '').trim(),
    author:      (b.author || '').trim(),
    genre:       b.genre || 'Non-Fiction',
    type:        b.type  || 'Non-Fiction',
    year:        b.year  || '',
    nation:      b.nation || '',
    description: b.description || '',
    is_base:     '0',
    is_sikkim:   b.is_sikkim ? '1' : '0',
    cover_url:   b.cover_url || '',
    rating: '', status: '', review: '', review_date: '',
    total_pages:  b.total_pages || '',
    current_page: '', date_started: '', date_finished: '',
    added_by: req.user.username,
    added_at: now,
  })).filter(b => b.title && b.author)

  await req.sheetsDB.bulkAppend('Books', prepared)
  res.status(201).json({ imported: prepared.length, books: prepared })
}))

// POST /api/books/seed — write all 233 base books to the Google Sheet
// Only runs if the sheet has no books yet (safe to call multiple times)
router.post('/seed', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)

  // Check if books already exist in the sheet
  const existing = await req.sheetsDB.readAll('Books')
  if (existing.length > 0) {
    return res.json({ seeded: 0, message: `Sheet already has ${existing.length} books — skipping seed` })
  }

  const BASE_BOOKS = require('../books_seed')
  const now = require('dayjs')().toISOString()

  const prepared = BASE_BOOKS.map(b => ({
    id:           require('crypto').randomUUID(),
    title:        b.title || '',
    author:       b.author || '',
    genre:        b.genre || 'Non-Fiction',
    type:         b.type  || 'Non-Fiction',
    year:         b.year  ? String(b.year) : '',
    nation:       b.nation || '',
    description:  b.description || '',
    is_base:      '1',
    is_sikkim:    b.is_sikkim ? '1' : '0',
    cover_url:    '',
    rating:       '',
    status:       '',
    review:       '',
    review_date:  '',
    total_pages:  b.total_pages ? String(b.total_pages) : '',
    current_page: '',
    date_started: '',
    date_finished:'',
    added_by:     'system',
    added_at:     now,
  }))

  await req.sheetsDB.bulkAppend('Books', prepared)
  res.status(201).json({ seeded: prepared.length, message: `${prepared.length} books added to your Google Sheet` })
}))


module.exports = router
