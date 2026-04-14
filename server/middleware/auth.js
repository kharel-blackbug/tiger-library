// server/middleware/auth.js
'use strict'

const jwt = require('jsonwebtoken')
const cfg = require('../config')

// Verify JWT and attach user to req
function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    req.user = jwt.verify(token, cfg.jwtSecret)
    next()
  } catch {
    res.clearCookie('token')
    res.status(401).json({ error: 'Session expired — please log in again' })
  }
}

// Only admin can write
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

// Public routes can still get user info if token present
function optionalAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    try { req.user = jwt.verify(token, cfg.jwtSecret) } catch {}
  }
  next()
}

module.exports = { requireAuth, requireAdmin, optionalAuth }
