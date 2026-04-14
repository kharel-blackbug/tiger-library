// src/pages/Dashboard.jsx
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLibrary } from '@/context/LibraryContext'
import { useAuth } from '@/context/AuthContext'
import { CONFIG } from '@/config'

function StatCard({ icon, label, value, sub, color = 'text-bamboo', onClick }) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2, transition: { duration: 0.15 } } : {}}
      onClick={onClick}
      className={`bg-white border border-fog-dark rounded-xl p-5 text-center transition-all ${
        onClick ? 'cursor-pointer hover:border-bamboo/50 hover:shadow-card' : ''
      }`}
    >
      <div className="text-2xl mb-2 opacity-60">{icon}</div>
      <div className={`font-display text-3xl font-medium ${color} leading-none mb-1`}>{value}</div>
      <div className="text-[9px] tracking-widest uppercase text-stone">{label}</div>
      {sub && <div className="text-[10px] text-stone/60 mt-1">{sub}</div>}
    </motion.div>
  )
}

function ProgressBar({ value, max, color = 'bg-bamboo' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="h-2 bg-fog rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { books, wishlist, dispatch } = useLibrary()
  const { user } = useAuth()

  // Compute all stats from local books array — no extra API call needed
  const stats = useMemo(() => {
    const total    = books.length
    const read     = books.filter(b => b.status === 'read').length
    const reading  = books.filter(b => b.status === 'reading').length
    const shelf    = books.filter(b => b.status === 'shelf').length
    // is_sikkim comes as string '1' from Sheets or number 1 from seed
    const sikkim   = books.filter(b => b.is_sikkim === '1' || b.is_sikkim === 1 || b.is_sikkim === true).length
    // rating comes as string from Sheets
    const ratedBooks = books.filter(b => b.rating && b.rating !== '0' && b.rating !== '')
    const rated    = ratedBooks.length
    const avgRat   = rated > 0
      ? (ratedBooks.reduce((s, b) => s + (parseFloat(b.rating) || 0), 0) / rated).toFixed(1)
      : null
    const pct      = total > 0 ? Math.round(read / total * 100) : 0
    const pagesRead = books
      .filter(b => b.status === 'read' && b.total_pages)
      .reduce((s, b) => s + (parseInt(b.total_pages) || 0), 0)

    const genres = {}
    books.forEach(b => { if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1 })
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 6)

    const currentlyReading = books.filter(b => b.status === 'reading')
    const recentRead = books
      .filter(b => b.status === 'read' && b.date_finished)
      .sort((a, b) => (b.date_finished || '') > (a.date_finished || '') ? 1 : -1)
      .slice(0, 5)

    return { total, read, reading, shelf, sikkim, rated, avgRat, pct, pagesRead, topGenres, currentlyReading, recentRead }
  }, [books])

  const goTo = (view, genre = null) => {
    if (genre) dispatch({ type: 'SET_GENRE', payload: genre })
    dispatch({ type: 'SET_VIEW', payload: view })
  }

  if (books.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="text-5xl mb-4 opacity-20">📊</div>
        <p className="font-serif italic text-stone text-xl mb-2">Dashboard will appear here</p>
        <p className="text-sm text-stone/60">Connect your Google Sheet in Settings and add some books to see your reading stats.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-ink mb-1">Reading Dashboard</h1>
        <p className="text-[10px] tracking-widest uppercase text-stone">
          {user?.display_name || user?.username} · Queenbridge, Gangtok
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="📚" label="Total Books"  value={stats.total}   onClick={() => goTo('library')} />
        <StatCard icon="✅" label="Books Read"   value={stats.read}    color="text-bamboo"     sub={`${stats.pct}% of collection`}   onClick={() => goTo('library')} />
        <StatCard icon="📖" label="Reading Now"  value={stats.reading} color="text-slate"      onClick={() => goTo('library')} />
        <StatCard icon="📚" label="On Shelf"     value={stats.shelf}   color="text-stone"      onClick={() => goTo('library')} />
        <StatCard icon="❤️" label="Wishlist"     value={wishlist.length} color="text-cedar"    onClick={() => goTo('wishlist')} />
        <StatCard icon="🏔" label="Sikkim Books" value={stats.sikkim}  color="text-bamboo-dark" onClick={() => goTo('library', 'sikkim')} />
        <StatCard icon="⭐" label="Avg Rating"   value={stats.avgRat || '—'} color="text-cedar" sub={stats.rated > 0 ? `${stats.rated} rated` : 'none yet'} />
        <StatCard icon="📄" label="Pages Read"   value={stats.pagesRead > 999 ? `${(stats.pagesRead/1000).toFixed(1)}k` : stats.pagesRead || '—'} color="text-slate-dark" />
      </div>

      {/* Collection Progress Bar */}
      <div className="bg-white border border-fog-dark rounded-xl p-5">
        <div className="flex justify-between items-baseline mb-3">
          <span className="font-display text-lg text-ink">Collection Progress</span>
          <span className="text-xs text-stone">{stats.read} of {stats.total} books finished</span>
        </div>
        <ProgressBar value={stats.read} max={stats.total} color="bg-gradient-to-r from-bamboo to-slate" />
        <div className="flex justify-between mt-2 text-[10px] text-stone font-sans">
          <span>{stats.read} read · {stats.reading} reading · {stats.shelf} on shelf</span>
          <span className="font-semibold text-bamboo">{stats.pct}%</span>
        </div>
      </div>

      {/* Currently reading */}
      {stats.currentlyReading.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-ink mb-4 pb-2 border-b border-fog-dark">
            📖 Currently Reading
          </h2>
          <div className="space-y-3">
            {stats.currentlyReading.map(b => {
              const pg  = parseInt(b.current_page) || 0
              const tot = parseInt(b.total_pages)  || 0
              const p   = tot > 0 ? Math.round(pg / tot * 100) : 0
              return (
                <div
                  key={b.id}
                  onClick={() => dispatch({ type: 'OPEN_DRAWER', payload: { bookId: b.id, tab: 'progress' } })}
                  className="bg-white border border-fog-dark rounded-xl p-4 flex gap-3 items-center cursor-pointer hover:border-bamboo/40 hover:shadow-card transition-all"
                >
                  <img
                    src={`${CONFIG.ui.coverBaseUrl}/${encodeURIComponent(b.title)}-S.jpg`}
                    alt={b.title}
                    className="w-10 h-14 object-cover rounded shrink-0 grayscale-[30%]"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif font-medium text-ink text-sm truncate">{b.title}</div>
                    <div className="text-xs text-stone italic mb-2">{b.author}</div>
                    {tot > 0 ? (
                      <>
                        <ProgressBar value={pg} max={tot} color="bg-bamboo" />
                        <div className="text-[10px] text-stone mt-1">
                          Page {pg} of {tot} · {p}%
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-stone/60">Open book to set page count</div>
                    )}
                    {b.date_started && (
                      <div className="text-[10px] text-stone/60 mt-1">Started: {b.date_started}</div>
                    )}
                  </div>
                  <div className="text-[9px] tracking-widest uppercase text-stone shrink-0">Update ›</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Genre + Recent Reads */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Genre Breakdown */}
        <div className="bg-white border border-fog-dark rounded-xl p-5">
          <h3 className="font-display text-lg text-ink mb-4">Genres</h3>
          {stats.topGenres.length === 0 ? (
            <p className="font-serif italic text-stone text-sm">No genre data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topGenres.map(([g, n]) => (
                <div
                  key={g}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => goTo('library', g)}
                >
                  <span className="w-24 text-xs text-stone text-right shrink-0 group-hover:text-bamboo transition-colors font-sans">
                    {g}
                  </span>
                  <div className="flex-1 h-2 bg-fog rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(n / stats.total * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-bamboo rounded-full"
                    />
                  </div>
                  <span className="text-xs text-stone w-5 text-right font-sans">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Finishes */}
        <div className="bg-white border border-fog-dark rounded-xl p-5">
          <h3 className="font-display text-lg text-ink mb-4">Recent Finishes</h3>
          {stats.recentRead.length === 0 ? (
            <p className="font-serif italic text-stone text-sm">
              No finished books with dates yet.{' '}
              <span className="text-stone/60">Add finish dates in the Progress tab.</span>
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentRead.map(b => (
                <div
                  key={b.id}
                  onClick={() => dispatch({ type: 'OPEN_DRAWER', payload: { bookId: b.id } })}
                  className="flex items-center gap-2 cursor-pointer hover:bg-mist rounded-lg p-1.5 -mx-1.5 transition-colors"
                >
                  <span className="text-lg shrink-0">
                    {CONFIG.ratings[parseInt(b.rating) || 0]?.emoji || '📖'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm text-ink truncate">{b.title}</div>
                    <div className="text-[10px] text-stone">{b.date_finished}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
