// src/config/index.js
// All configurable values — works in both browser (Vite) and Node/Jest

// Vite exposes env vars via import.meta.env; Node uses process.env
const getEnv = (key) => {
  try {
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key]
    }
  } catch (_) {}
  return typeof process !== 'undefined' ? process.env[key] : undefined
}

export const CONFIG = {
  api: {
    baseUrl: getEnv('VITE_API_URL') || '/api',
    timeout: 15000,
  },
  sheets: {
    storageKey:      'tl_sheets_config',
    localBooksKey:   'tl_local_books',
    localRatingsKey: 'tl_local_ratings',
    localReviewsKey: 'tl_local_reviews',
    quotesKey:       'tl_quotes',
    wishlistKey:     'tl_wishlist',
  },
  ui: {
    toastDuration: 3500,
    searchDebounce: 300,
    cardsPerPage: 50,
    coverBaseUrl: 'https://covers.openlibrary.org/b/title',
  },
  genres: [
    'Fiction', 'Non-Fiction', 'Graphic Novel', 'History',
    'Spirituality', 'Self-Help', 'Politics', 'Philosophy', 'Science',
  ],
  ratings: [
    null,
    { emoji: '💀', label: 'Life Lost',  sub: "Hours I'll never get back" },
    { emoji: '🥱', label: 'Meh',         sub: 'Finished it. Barely.' },
    { emoji: '☕', label: 'Solid Read',  sub: 'Good with a cup of chai' },
    { emoji: '🔥', label: 'Brilliant',   sub: 'Recommended to everyone' },
    { emoji: '🏔', label: 'Peak Life',   sub: 'Changed how I see things' },
  ],
  statusMap: {
    read:    { label: 'Read',     color: 'bg-bamboo/80 text-white' },
    reading: { label: 'Reading',  color: 'bg-slate/80 text-white' },
    shelf:   { label: 'On Shelf', color: 'bg-stone/70 text-white' },
  },
  genreColors: {
    'Fiction':       'border-l-slate',
    'Non-Fiction':   'border-l-bamboo',
    'Graphic Novel': 'border-l-stone',
    'History':       'border-l-bamboo-dark',
    'Spirituality':  'border-l-cedar',
    'Self-Help':     'border-l-bamboo-light',
    'Politics':      'border-l-slate-dark',
    'Philosophy':    'border-l-stone-dark',
    'Science':       'border-l-ink',
  },
  priorityMap: {
    high:   { label: '🔴 High',   color: 'text-red-600' },
    medium: { label: '🟡 Medium', color: 'text-yellow-600' },
    low:    { label: '🟢 Low',    color: 'text-bamboo' },
  },
}

export const SORT_OPTIONS = [
  { value: 'title',    label: 'Title A–Z' },
  { value: 'author',   label: 'Author A–Z' },
  { value: 'year',     label: 'Year: Oldest' },
  { value: 'yeardesc', label: 'Year: Newest' },
  { value: 'nation',   label: 'Nation' },
  { value: 'added',    label: 'Recently Added' },
]
