// src/pages/Library.jsx
import { useState, useCallback } from 'react'
import { LayoutGrid, List, Plus, Download } from 'lucide-react'
import { clsx } from 'clsx'
import { useLibrary } from '@/context/LibraryContext'
import { CONFIG, SORT_OPTIONS } from '@/config'
import BookCard from '@/components/BookCard'
import SearchBar from '@/components/SearchBar'
import AddBookModal from '@/components/AddBookModal'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const GENRES = [
  { key: 'all',    label: 'All' },
  ...CONFIG.genres.map(g => ({ key: g, label: g })),
  { key: 'sikkim', label: '🏔 Sikkim' },
  { key: 'new',    label: '✦ My Additions' },
]

export default function Library() {
  const {
    filteredBooks, books, activeGenre, sortBy, viewMode,
    dispatch, deleteBook
  } = useLibrary()

  const [modalOpen, setModalOpen]   = useState(false)
  const [editBook,  setEditBook]    = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleEdit = useCallback((book) => {
    setEditBook(book)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((book) => {
    if (book.is_base) { toast.error('Base catalogue books are protected'); return }
    setDeleteConfirm(book)
  }, [])

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeleteLoading(true)
    try {
      await deleteBook(deleteConfirm.id)
      setDeleteConfirm(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const exportPDF = () => {
    const win = window.open('', '_blank')
    const rows = books.map(b => `
      <tr>
        <td>${b.title}</td>
        <td>${b.author}</td>
        <td>${b.genre}</td>
        <td>${b.status || '—'}</td>
        <td>${b.rating ? CONFIG.ratings[b.rating]?.emoji + ' ' + CONFIG.ratings[b.rating]?.label : '—'}</td>
        <td>${b.date_finished || '—'}</td>
      </tr>`).join('')
    win.document.write(`
      <html><head><title>Tiger's Library</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; color: #2d4a3e; }
        h1 { font-size: 28px; margin-bottom: 4px; }
        p { color: #6b8fa0; font-size: 12px; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #4a7c6e; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #4a7c6e; }
        td { padding: 8px 12px; border-bottom: 1px solid #e8f0ec; }
        tr:hover td { background: #f4f7f5; }
      </style></head>
      <body>
        <h1>Tiger's Library</h1>
        <p>Queenbridge, Gangtok · ${books.length} volumes catalogued</p>
        <table>
          <thead><tr><th>Title</th><th>Author</th><th>Genre</th><th>Status</th><th>Rating</th><th>Finished</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="sticky top-[45px] z-30 bg-white/95 backdrop-blur border-b border-fog-dark px-4 sm:px-6 py-3 space-y-3">
        {/* Row 1: Search + actions */}
        <div className="flex gap-2 items-center">
          <SearchBar className="flex-1 max-w-sm" />
          <div className="flex gap-1.5 ml-auto items-center">
            <select
              value={sortBy}
              onChange={e => dispatch({ type: 'SET_SORT', payload: e.target.value })}
              className="hidden sm:block text-xs border border-fog-dark rounded-md px-2 py-2 text-stone bg-white focus:outline-none focus:border-bamboo"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: viewMode === 'grid' ? 'list' : 'grid' })}
              className="p-2 rounded-md border border-fog-dark text-stone hover:text-bamboo hover:border-bamboo transition-colors"
              title="Toggle view"
            >
              {viewMode === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
            </button>
            <Button size="sm" onClick={exportPDF} variant="secondary">
              <Download size={12} /> <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" onClick={() => { setEditBook(null); setModalOpen(true) }}>
              <Plus size={12} /> <span className="hidden sm:inline">Add Book</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Genre filters */}
        <div className="flex gap-1.5 flex-wrap">
          {GENRES.map(({ key, label }) => (
            <button
              key={key}
              data-testid={`genre-filter-${key}`}
              onClick={() => dispatch({ type: 'SET_GENRE', payload: key })}
              className={clsx(
                'px-3 py-1.5 text-[10px] tracking-widest uppercase rounded-md border font-sans transition-all duration-150',
                activeGenre === key
                  ? 'bg-bamboo text-white border-bamboo'
                  : 'border-fog-dark text-stone hover:border-bamboo/50 hover:text-bamboo bg-white'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-3">
        <span className="text-[10px] tracking-widest uppercase text-stone">
          {filteredBooks.length === books.length
            ? `All ${books.length} volumes`
            : `${filteredBooks.length} of ${books.length} volumes`}
        </span>
      </div>

      {/* Grid */}
      <div className="px-4 sm:px-6 pb-12">
        {filteredBooks.length === 0 ? (
          <div data-testid="empty-state" className="py-24 text-center">
            <p className="font-serif italic text-stone text-lg mb-2">No volumes found</p>
            <p className="text-xs text-stone/60">Try a different search or genre filter</p>
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              : 'flex flex-col gap-2'
          )}>
            {filteredBooks.map((book, i) => (
              <BookCard
                key={book.id}
                book={book}
                index={i}
                listView={viewMode === 'list'}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <AddBookModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditBook(null) }}
        editBook={editBook}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-ink/50 z-50" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-modal w-full max-w-sm p-6 text-center pointer-events-auto animate-fade-up">
              <div className="text-4xl mb-4 opacity-30">📖</div>
              <h3 className="font-display text-lg text-ink mb-2">{deleteConfirm.title}</h3>
              <p className="text-sm text-stone mb-6">This will permanently remove this book from your catalogue.</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Keep It</Button>
                <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={confirmDelete}>Remove</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
