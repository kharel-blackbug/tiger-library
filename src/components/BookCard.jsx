// src/components/BookCard.jsx
import { useState } from 'react'
import { clsx } from 'clsx'
import { Star, BookOpen, Archive, Pencil, Trash2 } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { CONFIG } from '@/config'
import Button from './ui/Button'

const GENRE_COLORS = {
  'Fiction':      'bg-slate',
  'Non-Fiction':  'bg-bamboo',
  'Graphic Novel':'bg-stone',
  'History':      'bg-bamboo-dark',
  'Spirituality': 'bg-cedar',
  'Self-Help':    'bg-bamboo-light',
  'Politics':     'bg-slate-dark',
  'Philosophy':   'bg-stone-dark',
  'Science':      'bg-ink',
}

export default function BookCard({ book, index = 0, onEdit, onDelete, listView = false }) {
  const { dispatch, setStatus } = useLibrary()
  const [imgError, setImgError] = useState(false)
  const [statusLoading, setStatusLoading] = useState(null)

  const coverUrl = `${CONFIG.ui.coverBaseUrl}/${encodeURIComponent(book.title)}-M.jpg`
  const yr = book.year ? (book.year > 0 ? book.year : `${Math.abs(book.year)} BCE`) : '—'
  const rating = CONFIG.ratings[book.rating]
  const genreColor = GENRE_COLORS[book.genre] || 'bg-stone'

  const handleStatus = async (st) => {
    setStatusLoading(st)
    try { await setStatus(book.id, st) }
    finally { setStatusLoading(null) }
  }

  const openDrawer = (tab = 'about') => {
    dispatch({ type: 'OPEN_DRAWER', payload: { bookId: book.id, tab } })
  }

  if (listView) {
    return (
      <div
        data-testid="book-card"
        className="flex gap-3 p-3 bg-white border border-fog-dark rounded-md hover:border-bamboo/40 hover:shadow-card transition-all cursor-pointer animate-fade-up group"
        style={{ animationDelay: `${Math.min(index * 15, 300)}ms` }}
        onClick={() => openDrawer()}
      >
        <div className={`w-1 rounded-full shrink-0 ${genreColor}`} />
        <div className="w-12 h-16 shrink-0 overflow-hidden rounded bg-mist-200">
          {!imgError
            ? <img src={coverUrl} alt={book.title} className="w-full h-full object-cover grayscale-[20%]" onError={() => setImgError(true)} />
            : <div className="w-full h-full flex items-center justify-center text-lg opacity-20">📚</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif font-medium text-ink text-sm leading-tight truncate">{book.title}</div>
          <div className="text-xs text-stone italic">{book.author}</div>
          {book.status && (
            <span className={clsx('inline-block mt-1 text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded', CONFIG.statusMap[book.status]?.color)}>
              {CONFIG.statusMap[book.status]?.label}
            </span>
          )}
        </div>
        <div className="text-xs text-stone shrink-0 self-center">{yr}</div>
        {rating && <div className="shrink-0 self-center text-base" title={rating.label}>{rating.emoji}</div>}
      </div>
    )
  }

  return (
    <div
      data-testid="book-card"
      className="bg-white border border-fog-dark rounded-lg overflow-hidden cursor-pointer group animate-fade-up hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
      style={{ animationDelay: `${Math.min(index * 15, 400)}ms` }}
      onClick={() => openDrawer()}
    >
      {/* Cover */}
      <div className="relative h-48 overflow-hidden bg-mist-200">
        {!imgError
          ? <img src={coverUrl} alt={book.title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-300" onError={() => setImgError(true)} />
          : <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-mist-100">
              <span className="text-4xl opacity-20 mb-2">📚</span>
              <span className="text-xs text-stone text-center leading-tight font-serif">{book.title}</span>
            </div>
        }
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-[10px] tracking-[4px] uppercase font-sans">Open Book</span>
        </div>
        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-fog-dark rounded px-2 py-1 flex items-center gap-1">
            <span className="text-xs">{rating.emoji}</span>
            <span className="text-[10px] text-stone font-medium tracking-wide">{rating.label}</span>
          </div>
        )}
        {/* Status pill */}
        {book.status && (
          <div className={clsx('absolute bottom-2 left-2 text-[9px] tracking-widest uppercase px-2 py-1 rounded flex items-center gap-1', CONFIG.statusMap[book.status]?.color)}>
            <span className="w-1 h-1 rounded-full bg-current" />
            {CONFIG.statusMap[book.status]?.label}
          </div>
        )}
        {book.is_sikkim && <div className="absolute top-2 left-2 text-sm" title="Sikkim Collection">🏔</div>}
        {!book.is_base && <div className="absolute top-2 left-2 bg-slate text-white text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded">New</div>}
      </div>

      {/* Genre ribbon */}
      <div className={`h-0.5 w-full ${genreColor}`} />

      {/* Body */}
      <div className="p-3" onClick={() => openDrawer()}>
        <div className="flex gap-1.5 mb-2">
          <span className="text-[9px] tracking-widest uppercase text-stone border border-fog-dark px-1.5 py-0.5 rounded">{book.genre}</span>
          <span className={clsx('text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded', book.type === 'Fiction' ? 'text-slate border border-slate/20' : 'text-bamboo border border-bamboo/20')}>{book.type}</span>
        </div>
        <div className="font-serif font-medium text-ink leading-snug mb-1 line-clamp-2">{book.title}</div>
        <div className="text-xs text-stone italic mb-1.5">{book.author}</div>
        <div className="text-[11px] text-stone/70 line-clamp-2 leading-relaxed">{book.description}</div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-fog-dark flex justify-between">
        <span className="text-[10px] text-stone/70">{book.nation || '—'}</span>
        <span className="text-[10px] text-stone/70"><strong className="text-stone">{yr}</strong></span>
      </div>

      {/* Quick actions — visible on hover */}
      <div className="hidden group-hover:flex border-t border-fog-dark" onClick={e => e.stopPropagation()}>
        {['read','reading','shelf'].map(st => (
          <button
            key={st}
            data-testid={`status-btn-${st}`}
            onClick={() => handleStatus(st)}
            disabled={statusLoading !== null}
            className={clsx(
              'flex-1 py-1.5 text-[9px] tracking-wide uppercase font-sans transition-colors border-r border-fog-dark last:border-r-0',
              book.status === st ? 'bg-bamboo/10 text-bamboo font-medium' : 'text-stone hover:bg-mist hover:text-bamboo',
              statusLoading === st && 'opacity-50 cursor-wait'
            )}
          >
            {statusLoading === st ? '…' : st === 'read' ? '✅' : st === 'reading' ? '📖' : '📚'} {st}
          </button>
        ))}
      </div>
      <div className="hidden group-hover:flex border-t border-fog-dark" onClick={e => e.stopPropagation()}>
        <button onClick={() => openDrawer('rating')} className="flex-1 py-1.5 text-[9px] tracking-wide uppercase text-stone hover:text-bamboo transition-colors flex items-center justify-center gap-1">
          <Star size={10} /> Review
        </button>
        <button onClick={() => onEdit?.(book)} className="flex-1 py-1.5 text-[9px] tracking-wide uppercase text-stone hover:text-slate transition-colors flex items-center justify-center gap-1 border-x border-fog-dark">
          <Pencil size={10} /> Edit
        </button>
        <button onClick={() => onDelete?.(book)} className="flex-1 py-1.5 text-[9px] tracking-wide uppercase text-stone hover:text-red-500 transition-colors flex items-center justify-center gap-1">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  )
}
