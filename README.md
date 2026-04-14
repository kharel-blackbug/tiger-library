# Tiger's Library 📚
### React · Tailwind CSS · Node.js · SQLite

A personal book catalogue for Tiger in Tashiling, Gangtok.  
**Mist & Bamboo** design theme — celadon green, slate blue, ink-wash calm.

---

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | React 18, Tailwind CSS 3, Vite  |
| Backend  | Node.js, Express 4              |
| Database | SQLite via better-sqlite3       |
| AI       | Anthropic Claude (server-side)  |
| Testing  | Jest 29, Testing Library, Playwright |

---

## Quick Start

```bash
# 1. Clone / unzip the project
cd tigers-library-react

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Start the app (both client + server)
npm run dev
# → Client: http://localhost:3000
# → Server: http://localhost:3001
```

---

## Running Tests

```bash
# All tests (unit + integration)
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage

# Server API tests only
npm run test:server

# React component tests only
npm run test:react

# E2E tests (requires app running)
npm run test:e2e

# E2E with interactive UI
npm run test:e2e:ui
```

### Test Results
```
Test Suites: 6 passed
Tests:       80 passed

  server  (23) — Books, Quotes, Wishlist, Stats, AI APIs
  react   (57) — Button, SearchBar, BookCard, LibraryContext, Library page
```

---

## Project Structure

```
tigers-library-react/
├── src/
│   ├── api/
│   │   └── client.js          # Fetch wrapper for all API calls
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx     # Button with loading/hover/disabled states
│   │   │   └── Input.jsx      # Input, Select, Textarea
│   │   ├── BookCard.jsx       # Grid + list card with quick actions
│   │   ├── BookDrawer.jsx     # Side panel — About, Rate, Quotes, Progress
│   │   ├── AddBookModal.jsx   # Add/Edit with AI lookup
│   │   ├── SearchBar.jsx      # Debounced search
│   │   ├── Hero.jsx           # Header with live stats
│   │   ├── Nav.jsx            # Tab navigation
│   │   └── ConfigPanel.jsx    # Google Sheets settings
│   ├── config/
│   │   └── index.js           # All config values (no hardcoding elsewhere)
│   ├── context/
│   │   └── LibraryContext.jsx # Global state via useReducer
│   ├── hooks/
│   │   └── index.js           # useDebounce, useLocalStorage, useAsync, useKeyPress
│   ├── pages/
│   │   ├── Library.jsx        # Main book grid with filters
│   │   ├── Dashboard.jsx      # Stats, progress, genre charts
│   │   └── Wishlist.jsx       # Reading wishlist with priorities
│   └── App.jsx
├── server/
│   ├── index.js               # Express server + all 14 API routes
│   └── books_seed.js          # 233 curated books (auto-seeded)
├── tests/
│   ├── unit/
│   │   ├── Button.test.jsx        # 10 tests
│   │   ├── SearchBar.test.jsx     # 8 tests
│   │   ├── BookCard.test.jsx      # 14 tests
│   │   └── LibraryContext.test.jsx # 10 tests
│   ├── integration/
│   │   ├── Library.test.jsx       # 15 tests — search, filter, error flows
│   │   └── server.test.js         # 23 tests — all REST endpoints
│   └── e2e/
│       └── library.spec.js        # Playwright — search, nav, drawer, mobile
├── jest.config.cjs
├── playwright.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Features

### 📚 Library
- 233 books pre-catalogued (Murakami, Dalrymple, Ghosh, Sikkim collection…)
- Grid / list toggle
- Genre filters: Fiction, Non-Fiction, History, Spirituality, Sikkim, My Additions…
- Live debounced search (title, author, nation, description)
- Sort by title, author, year, nation, date added

### 📖 Book Detail Drawer
- **About** — description, metadata
- **Rate & Review** — 💀🥱☕🔥🏔 rating system + written review
- **Quotes** — capture passages with page numbers
- **Progress** — page tracker with % bar, start/finish dates

### 📊 Dashboard
- 8 stat cards (Total, Read, Reading, Shelf, Wishlist, Sikkim, Avg Rating, % Read)
- Collection progress bar
- Currently Reading — live page progress per book
- Genre breakdown chart
- Recent Finishes with ratings

### ❤️ Wishlist
- 🔴🟡🟢 priority levels
- One-click "Move to Library"

### ✦ Add Book
- AI lookup: type title → Claude fills all details server-side (no CORS)
- Manual entry fallback
- Edit before saving
- Sikkim collection flag

### ⚙ Google Sheets Sync
- Reads from public Sheet via Sheets API v4
- Writes via Google Apps Script web app proxy
- Full localStorage fallback if offline
- Test Connection button

---

## API Endpoints

| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| GET    | `/api/books`              | List books (search, genre, sort) |
| POST   | `/api/books`              | Add user book             |
| PUT    | `/api/books/:id`          | Update book               |
| DELETE | `/api/books/:id`          | Delete (base books protected) |
| PUT    | `/api/books/:id/rating`   | Save rating + status      |
| PUT    | `/api/books/:id/review`   | Save review               |
| PUT    | `/api/books/:id/progress` | Save page progress + dates |
| GET    | `/api/books/:id/quotes`   | Get quotes                |
| POST   | `/api/books/:id/quotes`   | Add quote                 |
| DELETE | `/api/quotes/:id`         | Delete quote              |
| GET    | `/api/wishlist`           | Get wishlist              |
| POST   | `/api/wishlist`           | Add to wishlist           |
| DELETE | `/api/wishlist/:id`       | Remove from wishlist      |
| POST   | `/api/wishlist/:id/move`  | Move to library           |
| GET    | `/api/stats`              | Reading statistics        |
| POST   | `/api/ai/lookup`          | AI book details lookup    |

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-api03-...   # Required for AI book lookup
CLAUDE_MODEL=claude-sonnet-4-20250514 # Optional — defaults to this
PORT=3001                              # Optional — server port
CLIENT_URL=http://localhost:3000       # Optional — CORS origin
DB_PATH=./db/library.sqlite           # Optional — database path
```

---

## Design: Mist & Bamboo

Palette inspired by Sikkim's mist, bamboo groves, and mountain streams:

| Token       | Color   | Use                  |
|-------------|---------|----------------------|
| `bamboo`    | #4a7c6e | Primary actions, accents |
| `slate`     | #6b8fa0 | Secondary, Reading status |
| `mist`      | #f4f7f5 | Page background      |
| `parchment` | #f7f9f8 | Card background      |
| `fog`       | #e8f0ec | Borders, inputs      |
| `ink`       | #2d4a3e | Primary text         |

Fonts: **Playfair Display** (headings) · **EB Garamond** (body/quotes) · **Inter** (UI)

---

*Built for aggressive reading. From Tashiling, with chai.* ☕
