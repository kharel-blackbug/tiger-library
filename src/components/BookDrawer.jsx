// src/components/BookDrawer.jsx
import { useState, useEffect } from 'react'
import { X, Star, Quote, BarChart2, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useLibrary } from '@/context/LibraryContext'
import { useKeyPress, useLockScroll } from '@/hooks'
import { CONFIG } from '@/config'
import { api } from '@/api/client'
import Button from './ui/Button'
import { Textarea, Input } from './ui/Input'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'about',    label: 'About',    Icon: BookOpen },
  { id: 'rating',   label: 'Rate',     Icon: Star },
  { id: 'quotes',   label: 'Quotes',   Icon: Quote },
  { id: 'progress', label: 'Progress', Icon: BarChart2 },
]

export default function BookDrawer({ onEdit, onDelete }) {
  const { drawer, activeBook, dispatch, rateBook, saveReview, saveProgress } = useLibrary()
  const { open, tab } = drawer

  useLockScroll(open)
  useKeyPress('Escape', () => dispatch({ type: 'CLOSE_DRAWER' }))

  const [quotes, setQuotes] = useState([])
  const [quoteText, setQuoteText] = useState('')
  const [quotePage, setQuotePage] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewEditing, setReviewEditing] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(null)
  const [progressForm, setProgressForm] = useState({ total_pages: '', current_page: '', date_started: '', date_finished: '' })
  const [progressLoading, setProgressLoading] = useState(false)

  useEffect(() => {
    if (!activeBook) return
    setReviewText(activeBook.review || '')
    setReviewEditing(!activeBook.review)
    setProgressForm({
      total_pages:   activeBook.total_pages || '',
      current_page:  activeBook.current_page || '',
      date_started:  activeBook.date_started || '',
      date_finished: activeBook.date_finished || '',
    })
  }, [activeBook?.id])

  useEffect(() => {
    if (!activeBook || tab !== 'quotes') return
    api.getQuotes(activeBook.id).then(d => setQuotes(d.quotes || [])).catch(() => {})
  }, [activeBook?.id, tab])

  if (!open || !activeBook) return null

  const b = activeBook
  const yr = b.year ? (b.year > 0 ? b.year : `${Math.abs(b.year)} BCE`) : '—'
  const pct = b.total_pages && b.current_page ? Math.round(b.current_page / b.total_pages * 100) : 0

  const handleRate = async (val) => {
    setRatingLoading(val)
    try { await rateBook(b.id, val, b.status) }
    finally { setRatingLoading(null) }
  }

  const handleSaveReview = async () => {
    if (!reviewText.trim()) return
    setReviewLoading(true)
    try {
      await saveReview(b.id, reviewText.trim())
      setReviewEditing(false)
    } finally {
      setReviewLoading(false)
    }
  }

  const handleAddQuote = async () => {
    if (!quoteText.trim()) return
    setQuoteLoading(true)
    try {
      const result = await api.addQuote(b.id, { text: quoteText.trim(), page_ref: quotePage || null })
      setQuotes(prev => [result.quote, ...prev])
      setQuoteText('')
      setQuotePage('')
      toast.success('Quote saved')
    } catch { toast.error('Could not save quote') }
    finally { setQuoteLoading(false) }
  }

  const handleDeleteQuote = async (qid) => {
    try {
      await api.deleteQuote(qid)
      setQuotes(prev => prev.filter(q => q.id !== qid))
      toast.success('Quote removed')
    } catch { toast.error('Could not remove quote') }
  }

  const handleSaveProgress = async () => {
    setProgressLoading(true)
    try {
      await saveProgress(b.id, {
        total_pages:   progressForm.total_pages   ? parseInt(progressForm.total_pages)  : null,
        current_page:  progressForm.current_page  ? parseInt(progressForm.current_page) : null,
        date_started:  progressForm.date_started  || null,
        date_finished: progressForm.date_finished || null,
      })
    } finally { setProgressLoading(false) }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 z-40 animate-fade-in"
        onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
      />

      {/* Drawer */}
      <div
        data-testid="book-drawer"
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-parchment z-50 flex flex-col shadow-drawer animate-slide-in"
      >
        {/* Cover header */}
        <div className="relative h-44 bg-bamboo-deeper overflow-hidden shrink-0">
          <img
            src={`${CONFIG.ui.coverBaseUrl}/${encodeURIComponent(b.title)}-M.jpg`}
            alt={b.title}
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bamboo-deeper/80" />
          <div className="absolute bottom-4 left-4 right-12 z-10">
            <div className="flex gap-1.5 mb-1.5 flex-wrap">
              <span className="text-[9px] tracking-widest uppercase text-white/60 border border-white/20 px-2 py-0.5 rounded">{b.genre}</span>
              <span className="text-[9px] tracking-widest uppercase text-white/50 border border-white/10 px-2 py-0.5 rounded">{b.type}</span>
            </div>
            <h2 className="font-display text-white text-xl font-medium leading-snug">{b.title}</h2>
            <p className="text-white/60 text-xs italic mt-0.5">{b.author}</p>
          </div>
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button onClick={() => onEdit?.(b)} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete?.(b)} className="w-7 h-7 rounded bg-white/10 hover:bg-red-500/60 text-white/70 hover:text-white flex items-center justify-center transition-colors">
              <Trash2 size={12} />
            </button>
            <button data-testid="close-drawer" onClick={() => dispatch({ type: 'CLOSE_DRAWER' })} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-fog-dark shrink-0 bg-white">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              data-testid={`drawer-tab-${id}`}
              onClick={() => dispatch({ type: 'SET_DRAWER_TAB', payload: id })}
              className={clsx(
                'flex-1 py-3 text-[10px] tracking-widest uppercase font-sans flex items-center justify-center gap-1.5 border-b-2 transition-all',
                tab === id ? 'text-bamboo border-bamboo' : 'text-stone border-transparent hover:text-ink hover:border-fog-dark'
              )}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">

          {/* ABOUT */}
          {tab === 'about' && (
            <div className="p-5 space-y-5">
              <p className="font-serif italic text-ink/80 leading-relaxed text-[15px]">
                {b.description || 'No description available.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[['Genre', b.genre], ['Type', b.type], ['Published', yr], ['Nation', b.nation || '—']].map(([lbl, val]) => (
                  <div key={lbl} className="bg-fog rounded-md p-3">
                    <div className="text-[9px] tracking-widest uppercase text-stone mb-1">{lbl}</div>
                    <div className="font-serif text-ink text-sm">{val}</div>
                  </div>
                ))}
              </div>
              {b.is_sikkim && (
                <div className="flex items-center gap-2 text-bamboo text-sm bg-bamboo/5 border border-bamboo/20 rounded-md px-3 py-2">
                  <span>🏔</span> Part of the Sikkim Collection
                </div>
              )}
            </div>
          )}

          {/* RATING */}
          {tab === 'rating' && (
            <div className="p-5 space-y-6">
              {b.rating && (
                <div className="flex items-center gap-3 bg-bamboo/5 border border-bamboo/20 rounded-lg p-4">
                  <span className="text-3xl">{CONFIG.ratings[b.rating].emoji}</span>
                  <div>
                    <div className="font-display text-lg text-bamboo-dark">{CONFIG.ratings[b.rating].label}</div>
                    <div className="text-xs text-stone italic">{CONFIG.ratings[b.rating].sub}</div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-xs tracking-widest uppercase text-stone mb-3">Pick a rating</div>
                {CONFIG.ratings.slice(1).map((r, i) => (
                  <button
                    key={i+1}
                    data-testid={`rating-btn-${i+1}`}
                    onClick={() => handleRate(i+1)}
                    disabled={ratingLoading !== null}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      b.rating === i+1 ? 'border-bamboo bg-bamboo/5 ring-1 ring-bamboo/30' : 'border-fog-dark hover:border-bamboo/40 hover:bg-fog',
                      ratingLoading === i+1 && 'opacity-60 cursor-wait'
                    )}
                  >
                    <span className="text-xl">{r.emoji}</span>
                    <div>
                      <div className="font-serif text-sm text-ink">{r.label}</div>
                      <div className="text-[11px] text-stone italic">{r.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Review */}
              <div>
                <div className="text-xs tracking-widest uppercase text-stone mb-3">Your Review</div>
                {b.review && !reviewEditing ? (
                  <div>
                    <div className="border-l-2 border-bamboo pl-4 py-1">
                      <p className="font-serif italic text-ink/80 text-[15px] leading-relaxed">{b.review}</p>
                      {b.review_date && <p className="text-[10px] text-stone mt-2">{new Date(b.review_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setReviewEditing(true)}>
                      <Pencil size={11} /> Edit review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Your thoughts on this book…"
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" loading={reviewLoading} onClick={handleSaveReview}>Save Review</Button>
                      {b.review && <Button variant="secondary" size="sm" onClick={() => { setReviewText(b.review); setReviewEditing(false) }}>Cancel</Button>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUOTES */}
          {tab === 'quotes' && (
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Textarea placeholder="Paste a favourite passage…" value={quoteText} onChange={e => setQuoteText(e.target.value)} rows={3} />
                <div className="flex gap-2 items-center">
                  <Input placeholder="Page no." value={quotePage} onChange={e => setQuotePage(e.target.value)} className="w-24" />
                  <Button size="sm" loading={quoteLoading} onClick={handleAddQuote} disabled={!quoteText.trim()}>
                    Save Quote
                  </Button>
                </div>
              </div>

              {quotes.length === 0 ? (
                <p className="font-serif italic text-stone text-sm text-center py-8">No passages captured yet.<br />The best lines deserve to live on.</p>
              ) : (
                <div className="space-y-3">
                  <div className="text-[9px] tracking-widest uppercase text-stone">{quotes.length} passage{quotes.length > 1 ? 's' : ''}</div>
                  {quotes.map(q => (
                    <div key={q.id} className="border-l-2 border-bamboo/40 pl-4 py-1 group/quote">
                      <p className="font-serif italic text-ink/80 text-[15px] leading-relaxed">{q.text}</p>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] text-stone">{q.page_ref ? `📌 p. ${q.page_ref}` : ''}</span>
                        <button onClick={() => handleDeleteQuote(q.id)} className="text-[10px] text-stone/0 group-hover/quote:text-stone hover:!text-red-500 transition-colors">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROGRESS */}
          {tab === 'progress' && (
            <div className="p-5 space-y-5">
              {b.total_pages && b.current_page && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-display text-2xl text-bamboo">{pct}%</span>
                    <span className="text-stone text-xs self-end">Page {b.current_page} of {b.total_pages}</span>
                  </div>
                  <div className="h-2 bg-fog rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-bamboo to-slate rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total Pages" type="number" min="1" placeholder="e.g. 320"
                  value={progressForm.total_pages} onChange={e => setProgressForm(p => ({ ...p, total_pages: e.target.value }))} />
                <Input label="Current Page" type="number" min="0" placeholder="e.g. 142"
                  value={progressForm.current_page} onChange={e => setProgressForm(p => ({ ...p, current_page: e.target.value }))} />
                <Input label="Date Started" type="date"
                  value={progressForm.date_started} onChange={e => setProgressForm(p => ({ ...p, date_started: e.target.value }))} />
                <Input label="Date Finished" type="date"
                  value={progressForm.date_finished} onChange={e => setProgressForm(p => ({ ...p, date_finished: e.target.value }))} />
              </div>
              <Button loading={progressLoading} onClick={handleSaveProgress} className="w-full">
                <BarChart2 size={14} /> Save Progress
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
