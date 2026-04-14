// src/api/client.js
// VITE_API_URL is injected at build time by Vite's `define` config.
// In dev: empty string → Vite proxy sends /api/* to localhost:3001
// In prod (GitHub Pages): Railway backend URL, set via GitHub Actions secret
// In Jest: process.env.VITE_API_URL = '' (default) so all calls go to /api/*
const BASE = (process.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(method, path, body, isFormData = false) {
  const opts = {
    method,
    credentials: 'include',
    signal: AbortSignal.timeout(30000),
  }
  if (body && !isFormData) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  } else if (isFormData) {
    opts.body = body
  }
  const res = await fetch(`${BASE}/api${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  login:        d     => request('POST', '/auth/login', d),
  logout:       ()    => request('POST', '/auth/logout'),
  me:           ()    => request('GET',  '/auth/me'),
  changePass:   d     => request('PUT',  '/auth/password', d),
  connectSheet: d     => request('PUT',  '/auth/sheets', d),
  sheetStatus:  ()    => request('GET',  '/auth/sheets/status'),
  getBooks:     (p={})=> request('GET', `/books?${new URLSearchParams(p)}`),
  getBook:      id    => request('GET', `/books/${id}`),
  addBook:      d     => request('POST', '/books', d),
  updateBook:   (id,d)=> request('PUT',  `/books/${id}`, d),
  deleteBook:   id    => request('DELETE', `/books/${id}`),
  setStatus:    (id,d)=> request('PUT',  `/books/${id}/status`, d),
  saveReview:   (id,d)=> request('PUT',  `/books/${id}/review`, d),
  saveProgress: (id,d)=> request('PUT',  `/books/${id}/progress`, d),
  bulkImport:   d     => request('POST', '/books/bulk', d),
  getQuotes:    id    => request('GET',  `/books/${id}/quotes`),
  addQuote:     (id,d)=> request('POST', `/books/${id}/quotes`, d),
  deleteQuote:  id    => request('DELETE', `/quotes/${id}`),
  getWishlist:  ()    => request('GET',  '/wishlist'),
  addWish:      d     => request('POST', '/wishlist', d),
  deleteWish:   id    => request('DELETE', `/wishlist/${id}`),
  moveToLib:    id    => request('POST', `/wishlist/${id}/move`),
  getGoals:     ()    => request('GET',  '/goals'),
  addGoal:      d     => request('POST', '/goals', d),
  updateGoal:   (id,d)=> request('PUT',  `/goals/${id}`, d),
  deleteGoal:   id    => request('DELETE', `/goals/${id}`),
  scanImages:   fd    => request('POST', '/scan', fd, true),
  lookupBook:   d     => request('POST', '/scan/lookup', d),
  getStats:     ()    => request('GET',  '/stats'),
}
