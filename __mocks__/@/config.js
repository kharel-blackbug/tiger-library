const CONFIG = {
  api: { baseUrl: '/api', timeout: 15000 },
  sheets: { storageKey: 'tl_sheets_config', localBooksKey: 'tl_local_books', localRatingsKey: 'tl_local_ratings', localReviewsKey: 'tl_local_reviews', quotesKey: 'tl_quotes', wishlistKey: 'tl_wishlist' },
  ui: { toastDuration: 3500, searchDebounce: 300, cardsPerPage: 50, coverBaseUrl: 'https://covers.openlibrary.org/b/title' },
  genres: ['Fiction','Non-Fiction','Graphic Novel','History','Spirituality','Self-Help','Politics','Philosophy','Science'],
  ratings: [null,
    {e:'💀',emoji:'💀',l:'Life Lost',label:'Life Lost',s:'Hours',sub:'Hours'},
    {e:'🥱',emoji:'🥱',l:'Meh',label:'Meh',s:'Barely',sub:'Barely'},
    {e:'☕',emoji:'☕',l:'Solid Read',label:'Solid Read',s:'Chai',sub:'Chai'},
    {e:'🔥',emoji:'🔥',l:'Brilliant',label:'Brilliant',s:'Recommended',sub:'Recommended'},
    {e:'🏔',emoji:'🏔',l:'Peak Life',label:'Peak Life',s:'Changed',sub:'Changed'},
  ],
  statusMap: {
    read:    { label: 'Read',     color: 'bg-bamboo/80 text-white' },
    reading: { label: 'Reading',  color: 'bg-slate/80 text-white' },
    shelf:   { label: 'On Shelf', color: 'bg-stone/70 text-white' },
  },
  genreColors: {},
  priorityMap: {
    high:   { label: '🔴 High',   color: 'text-red-600' },
    medium: { label: '🟡 Medium', color: 'text-yellow-600' },
    low:    { label: '🟢 Low',    color: 'text-bamboo' },
  },
}
const SORT_OPTIONS = [
  { value: 'title', label: 'Title A–Z' },
  { value: 'author', label: 'Author A–Z' },
]
module.exports = { CONFIG, SORT_OPTIONS }
