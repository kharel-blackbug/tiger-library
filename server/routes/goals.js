// server/routes/goals.js
'use strict'
const express = require('express')
const { randomUUID: uuid } = require('crypto')
const dayjs = require('dayjs')
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth')
const router = express.Router()
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const noSheets = res => res.status(503).json({ error: 'Google Sheet not configured' })

router.get('/', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const goals = await req.sheetsDB.readAll('Goals')
  res.json({ goals })
}))

router.get('/:id', optionalAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const goals = await req.sheetsDB.readAll('Goals')
  const goal  = goals.find(g => g.id === req.params.id)
  if (!goal) return res.status(404).json({ error: 'Goal not found' })
  res.json({ goal })
}))

router.post('/', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const { name, description, target_date, book_ids } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  if (!Array.isArray(book_ids) || !book_ids.length) return res.status(400).json({ error: 'book_ids required' })

  const now = dayjs().toISOString()
  const goal = {
    id:          uuid(),
    name:        name.trim(),
    description: description || '',
    target_date: target_date || '',
    status:      'active',
    book_ids:    JSON.stringify(book_ids),
    owner:       req.user.username,
    created_at:  now,
    updated_at:  now,
  }
  await req.sheetsDB.upsert('Goals', goal)
  res.status(201).json({ goal })
}))

router.put('/:id', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  const goals = await req.sheetsDB.readAll('Goals')
  const goal  = goals.find(g => g.id === req.params.id)
  if (!goal) return res.status(404).json({ error: 'Not found' })

  const { name, description, target_date, status, book_ids } = req.body
  const updated = {
    ...goal,
    name:        name        || goal.name,
    description: description || goal.description,
    target_date: target_date || goal.target_date,
    status:      status      || goal.status,
    book_ids:    book_ids ? JSON.stringify(book_ids) : goal.book_ids,
    updated_at:  dayjs().toISOString(),
  }
  await req.sheetsDB.upsert('Goals', updated)
  res.json({ goal: updated })
}))

router.delete('/:id', requireAuth, wrap(async (req, res) => {
  if (!req.sheetsDB) return noSheets(res)
  await req.sheetsDB.deleteById('Goals', req.params.id)
  res.json({ ok: true })
}))

module.exports = router
