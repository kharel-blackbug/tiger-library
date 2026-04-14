// src/components/SearchBar.jsx
import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { useDebounce } from '@/hooks'
import { CONFIG } from '@/config'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

export default function SearchBar({ className = '' }) {
  const { dispatch } = useLibrary()
  const [local, setLocal] = useState('')
  const debounced = useDebounce(local, CONFIG.ui.searchDebounce)
  const inputRef = useRef(null)

  useEffect(() => {
    dispatch({ type: 'SET_SEARCH', payload: debounced })
  }, [debounced, dispatch])

  const clear = () => {
    setLocal('')
    inputRef.current?.focus()
  }

  return (
    <div className={clsx('relative flex items-center', className)}>
      <Search size={14} className="absolute left-3 text-stone pointer-events-none" />
      <input
        ref={inputRef}
        data-testid="search-input"
        type="text"
        placeholder="Search title, author, nation…"
        value={local}
        onChange={e => setLocal(e.target.value)}
        className="w-full pl-9 pr-8 py-2.5 text-sm font-sans bg-white border border-fog-dark rounded-md text-ink placeholder-stone/50 focus:outline-none focus:ring-2 focus:ring-bamboo/30 focus:border-bamboo transition-colors"
      />
      {local && (
        <button
          data-testid="search-clear"
          onClick={clear}
          className="absolute right-2.5 text-stone hover:text-ink transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
