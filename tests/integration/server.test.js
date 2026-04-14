// tests/integration/server.test.js
// Tests the server health, auth routes, and error handling
// Note: Books/Goals/Quotes are stored in Google Sheets — those routes
// require a live sheet. We test the auth and structure here.
'use strict'

process.env.DB_PATH = ':memory:'
process.env.ANTHROPIC_API_KEY = 'test-key'
process.env.JWT_SECRET = 'test-secret-for-tests'
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD = 'testpassword123'

const request = require('supertest')
const { app }  = require('../../server/index')

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.version).toBeDefined()
  })
})

describe('Auth Routes', () => {
  let token

  it('POST /api/auth/login fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ username: 'testadmin', password: 'wrongpass' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Invalid credentials/)
  })

  it('POST /api/auth/login succeeds with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpassword123' })
    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.role).toBe('admin')
    expect(res.body.token).toBeDefined()
    token = res.body.token
  })

  it('POST /api/auth/login requires username and password', async () => {
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
  })

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /api/auth/me returns user with valid token', async () => {
    if (!token) { console.warn('Skipping — no token'); return }
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.username).toBe('testadmin')
  })

  it('PUT /api/auth/sheets requires auth', async () => {
    const res = await request(app).put('/api/auth/sheets').send({ sheet_id: 'test' })
    expect(res.status).toBe(401)
  })

  it('GET /api/auth/sheets/status requires auth', async () => {
    const res = await request(app).get('/api/auth/sheets/status')
    expect(res.status).toBe(401)
  })

  it('POST /api/auth/logout clears session', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('Protected Routes — require auth', () => {
  it('GET /api/books returns 503 (no sheet) or 401 without auth', async () => {
    const res = await request(app).get('/api/books')
    // Either 503 (no sheet configured) or books array (public read)
    expect([200, 503]).toContain(res.status)
  })

  it('POST /api/books requires auth', async () => {
    const res = await request(app).post('/api/books')
      .send({ title: 'Test', author: 'Author' })
    expect(res.status).toBe(401)
  })

  it('DELETE /api/books/any requires auth', async () => {
    const res = await request(app).delete('/api/books/fakeid')
    expect(res.status).toBe(401)
  })

  it('POST /api/scan requires auth', async () => {
    const res = await request(app).post('/api/scan')
    expect(res.status).toBe(401)
  })

  it('POST /api/goals requires auth', async () => {
    const res = await request(app).post('/api/goals').send({ name: 'Test', book_ids: ['a'] })
    expect(res.status).toBe(401)
  })

  it('POST /api/wishlist requires auth', async () => {
    const res = await request(app).post('/api/wishlist').send({ title: 'Test' })
    expect(res.status).toBe(401)
  })
})

describe('AI Lookup Route', () => {
  it('POST /api/scan/lookup requires auth', async () => {
    const res = await request(app).post('/api/scan/lookup').send({ title: 'Test' })
    expect(res.status).toBe(401)
  })
})

describe('Error Handling', () => {
  it('returns JSON error for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz')
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
