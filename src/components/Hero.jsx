// src/components/Hero.jsx
import { useLibrary } from '@/context/LibraryContext'

export default function Hero() {
  const { books, wishlist, dispatch } = useLibrary()

  const stats = [
    { label: 'Volumes',  value: books.length,                               view: 'library' },
    { label: 'Read',     value: books.filter(b => b.status === 'read').length, view: 'library' },
    { label: 'Sikkim',   value: books.filter(b => b.is_sikkim).length,      view: 'library', genre: 'sikkim' },
    { label: 'Wishlist', value: wishlist.length,                             view: 'wishlist' },
  ]

  const handleStatClick = ({ view, genre }) => {
    if (genre) dispatch({ type: 'SET_GENRE', payload: genre })
    dispatch({ type: 'SET_VIEW', payload: view })
  }

  return (
    <div className="relative bg-bamboo-deeper overflow-hidden">
      {/* Celadon grid lines */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Mist gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bamboo-deeper/60 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 sm:py-16 text-center">
        <p className="text-[9px] tracking-[8px] uppercase text-white/30 mb-5 font-sans">
          Queenbridge · Gangtok · Sikkim
        </p>

        <h1 className="font-display font-bold text-white leading-none mb-2"
          style={{ fontSize: 'clamp(42px, 9vw, 96px)' }}>
          Tiger's
        </h1>
        <h1 className="font-display font-bold text-white/40 italic leading-none mb-6"
          style={{ fontSize: 'clamp(42px, 9vw, 96px)' }}>
          Library
        </h1>

        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px flex-1 bg-white/10 max-w-[80px]" />
          <span className="text-bamboo-light text-xs">✦</span>
          <div className="h-px flex-1 bg-white/10 max-w-[80px]" />
        </div>

        <div className="flex justify-center gap-8 sm:gap-12 flex-wrap">
          {stats.map(s => (
            <button
              key={s.label}
              onClick={() => handleStatClick(s)}
              className="text-center group transition-transform hover:-translate-y-1"
            >
              <span className="font-display text-4xl text-white block leading-none group-hover:text-bamboo-light transition-colors">
                {s.value}
              </span>
              <span className="text-[9px] tracking-[3px] uppercase text-white/30 mt-1 block">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
