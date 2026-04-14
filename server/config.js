// server/config.js
'use strict'
require('dotenv').config()

module.exports = {
  port:           process.env.PORT || 3001,
  clientUrl:      process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret:      process.env.JWT_SECRET || 'tigers-library-dev-secret-change-in-prod',
  jwtExpiry:      process.env.JWT_EXPIRY || '7d',
  adminUsername:  process.env.ADMIN_USERNAME || 'admin',
  adminPassword:  process.env.ADMIN_PASSWORD || 'changeme123',   // hashed on first boot
  readerUsername: process.env.READER_USERNAME || 'reader',
  readerPassword: process.env.READER_PASSWORD || 'readonly123',  // hashed on first boot
  anthropicKey:   process.env.ANTHROPIC_API_KEY || '',
  claudeModel:    process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  uploadsDir:     process.env.UPLOADS_DIR || (
    process.env.NODE_ENV === 'production'
      ? '/data/uploads'
      : require('path').join(__dirname, '../uploads')
  ),
  dbPath:         process.env.DB_PATH || (
    process.env.NODE_ENV === 'production'
      ? '/data/db/library.sqlite'
      : require('path').join(__dirname, '../db/library.sqlite')
  ),
  // Google Sheets — users provide these via the app UI, stored in DB
  sheetsTabBooks:    'Books',
  sheetsTabQuotes:   'Quotes',
  sheetsTabWishlist: 'Wishlist',
  sheetsTabGoals:    'Goals',
  sheetsTabUsers:    'Users',
}
