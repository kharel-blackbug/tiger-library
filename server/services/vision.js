// server/services/vision.js
// Uses Claude's vision to read book covers/spines and extract metadata
'use strict'

const fs  = require('fs')
const cfg = require('../config')

async function scanBookImage(imagePath) {
  if (!cfg.anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const imageBuffer = fs.readFileSync(imagePath)
  const base64Image = imageBuffer.toString('base64')
  const ext = imagePath.split('.').pop().toLowerCase()
  const mediaType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                  : ext === 'png'  ? 'image/png'
                  : ext === 'webp' ? 'image/webp'
                  : 'image/jpeg'

  const prompt = `You are a book cataloguing expert. Examine this image carefully.
It may show a book cover, book spine, shelf of books, or multiple books.

Extract ALL books you can identify. For each book return:
- title: exact title as shown
- author: author name(s)  
- genre: one of exactly: Fiction, Non-Fiction, Graphic Novel, History, Spirituality, Self-Help, Politics, Philosophy, Science
- type: exactly "Fiction" or "Non-Fiction"
- year: publication year as integer if visible, else null
- nation: country of origin with flag emoji if you can determine it, else null
- description: a 1-2 sentence catalogue description based on your knowledge of this book
- total_pages: estimated page count based on your knowledge, or null

Return ONLY a JSON array, no markdown, no explanation:
[{"title":"...","author":"...","genre":"...","type":"...","year":null,"nation":"...","description":"...","total_pages":null}]

If no books are identifiable, return [].`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      cfg.claudeModel,
      max_tokens: 4096,
      messages: [{
        role:    'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
          { type: 'text',  text: prompt },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const e = await response.json().catch(() => ({}))
    throw new Error(e?.error?.message || `Claude API error ${response.status}`)
  }

  const data = await response.json()
  const raw  = (data.content?.find(c => c.type === 'text')?.text || '')
    .replace(/```json\s*/g, '').replace(/```/g, '').trim()

  let books
  try {
    books = JSON.parse(raw)
    if (!Array.isArray(books)) books = [books]
  } catch {
    throw new Error('Could not parse book data from image — try a clearer photo')
  }

  return books.filter(b => b && b.title)
}

async function lookupBook(title, author) {
  if (!cfg.anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const prompt = `You are a book database. Return ONLY raw JSON, no markdown.
Book: "${title}"${author ? `\nAuthor: "${author}"` : ''}
Return exactly:
{"title":"official title","author":"full name(s)","genre":"one of: Fiction, Non-Fiction, Graphic Novel, History, Spirituality, Self-Help, Politics, Philosophy, Science","type":"Fiction or Non-Fiction","year":1984,"nation":"🇮🇳 India","description":"2-3 sentence catalogue description.","total_pages":320}
Rules: genre exactly one listed value. type exactly Fiction or Non-Fiction. year integer. nation with correct flag emoji. total_pages integer estimate.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         cfg.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      cfg.claudeModel,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const e = await response.json().catch(() => ({}))
    throw new Error(e?.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const raw  = (data.content?.find(c => c.type === 'text')?.text || '')
    .replace(/```json\s*/g, '').replace(/```/g, '').trim()

  return JSON.parse(raw)
}

module.exports = { scanBookImage, lookupBook }
