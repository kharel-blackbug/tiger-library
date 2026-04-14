// src/pages/BookScan.jsx
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Check, X, Plus, Loader2, Image, BookOpen } from 'lucide-react'
import { api } from '@/api/client'
import { useLibrary } from '@/context/LibraryContext'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { CONFIG } from '@/config'
import toast from 'react-hot-toast'

function BookPreviewCard({ book, selected, onToggle, onEdit }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative bg-white rounded-xl border-2 transition-all cursor-pointer ${
        selected ? 'border-bamboo shadow-card-hover' : 'border-fog-dark hover:border-bamboo/40'
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        selected ? 'bg-bamboo border-bamboo' : 'border-fog-dark bg-white'
      }`}>
        {selected && <Check size={10} className="text-white" />}
      </div>

      {/* Cover placeholder */}
      <div className="h-32 bg-gradient-to-br from-mist to-fog rounded-t-xl flex items-center justify-center">
        <BookOpen size={32} className="text-stone/40" />
      </div>

      <div className="p-3">
        <div className="font-serif font-medium text-ink text-sm leading-snug line-clamp-2 mb-1">
          {book.title || 'Unknown Title'}
        </div>
        <div className="text-xs text-stone italic mb-2">{book.author || 'Unknown Author'}</div>
        <div className="flex gap-1 flex-wrap">
          {book.genre && (
            <span className="text-[9px] tracking-widest uppercase border border-fog-dark px-1.5 py-0.5 rounded text-stone">
              {book.genre}
            </span>
          )}
          {book.year && (
            <span className="text-[9px] text-stone/60">{book.year}</span>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        className="w-full text-center text-[10px] tracking-widest uppercase text-bamboo hover:bg-bamboo/5 py-2 border-t border-fog-dark rounded-b-xl transition-colors"
      >
        Edit Details
      </button>
    </motion.div>
  )
}

function EditModal({ book, onSave, onClose }) {
  const [form, setForm] = useState({ ...book })
  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-modal w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-fog-dark flex justify-between items-center bg-bamboo-deeper rounded-t-2xl">
          <h3 className="font-display text-xl text-white">Edit Book</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <Input label="Title *" value={form.title || ''} onChange={f('title')} />
          <Input label="Author *" value={form.author || ''} onChange={f('author')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Genre" value={form.genre || ''} onChange={f('genre')}>
              <option value="">— Select —</option>
              {CONFIG.genres.map(g => <option key={g}>{g}</option>)}
            </Select>
            <Select label="Type" value={form.type || ''} onChange={f('type')}>
              <option value="">— Select —</option>
              <option>Fiction</option>
              <option>Non-Fiction</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Year" type="number" value={form.year || ''} onChange={f('year')} />
            <Input label="Nation" value={form.nation || ''} onChange={f('nation')} placeholder="🇮🇳 India" />
          </div>
          <Input label="Total Pages" type="number" value={form.total_pages || ''} onChange={f('total_pages')} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium tracking-widest uppercase text-stone">Description</label>
            <textarea
              value={form.description || ''}
              onChange={f('description')}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-fog-dark rounded-md text-ink focus:outline-none focus:border-bamboo focus:ring-2 focus:ring-bamboo/20 resize-y"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone cursor-pointer">
            <input type="checkbox" checked={!!form.is_sikkim}
              onChange={e => setForm(p => ({ ...p, is_sikkim: e.target.checked }))}
              className="accent-bamboo" />
            Add to Sikkim Collection 🏔
          </label>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-fog-dark bg-mist rounded-b-2xl">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => onSave(form)}>Save Changes</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function BookScan() {
  const { fetchBooks } = useLibrary()
  const [scanning, setScanning]       = useState(false)
  const [scanned, setScanned]         = useState([])   // { book, selected, id }
  const [selected, setSelected]       = useState(new Set())
  const [importing, setImporting]     = useState(false)
  const [editBook, setEditBook]       = useState(null)
  const [editIdx, setEditIdx]         = useState(null)
  const [previews, setPreviews]       = useState([])   // image preview URLs

  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setScanning(true)
    setPreviews(files.map(f => URL.createObjectURL(f)))

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('images', f))
      const data = await api.scanImages(formData)

      const books = data.results.flatMap(r => r.books).map((b, i) => ({
        ...b, _id: `scan_${i}_${Date.now()}`
      }))

      if (!books.length) {
        toast.error('No books detected — try a clearer photo showing covers or spines')
        return
      }

      setScanned(books)
      setSelected(new Set(books.map(b => b._id)))
      toast.success(`Found ${books.length} book${books.length > 1 ? 's' : ''}`)
    } catch (e) {
      toast.error('Scan failed: ' + e.message)
    } finally {
      setScanning(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 10,
    disabled: scanning,
  })

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleEdit = (idx) => {
    setEditBook({ ...scanned[idx] })
    setEditIdx(idx)
  }

  const handleSaveEdit = (updated) => {
    setScanned(prev => prev.map((b, i) => i === editIdx ? { ...updated, _id: b._id } : b))
    setEditBook(null)
    setEditIdx(null)
  }

  const handleImport = async () => {
    const toImport = scanned.filter(b => selected.has(b._id))
    if (!toImport.length) { toast.error('Select at least one book'); return }
    setImporting(true)
    try {
      const data = await api.bulkImport({ books: toImport })
      toast.success(`✓ ${data.imported} books added to your library`)
      await fetchBooks()
      setScanned([])
      setSelected(new Set())
      setPreviews([])
    } catch (e) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink mb-1 flex items-center gap-3">
          <Camera className="text-bamboo" size={28} />
          Scan Books
        </h1>
        <p className="text-sm text-stone">
          Photograph your bookshelf, book covers, or spines. Claude reads the image and catalogues everything automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-8 ${
          isDragActive
            ? 'border-bamboo bg-bamboo/5 scale-[1.01]'
            : scanning
            ? 'border-fog-dark bg-mist cursor-wait'
            : 'border-fog-dark hover:border-bamboo/50 hover:bg-mist'
        }`}
      >
        <input {...getInputProps()} />
        {scanning ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-bamboo animate-spin" />
            <p className="font-serif italic text-stone text-lg">Reading your books…</p>
            <p className="text-xs text-stone/60">Claude is scanning the image and identifying titles</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-bamboo/10 rounded-2xl flex items-center justify-center">
              <Image size={28} className="text-bamboo" />
            </div>
            <div>
              <p className="font-serif text-xl text-ink mb-1">
                {isDragActive ? 'Drop images here' : 'Drag book photos here'}
              </p>
              <p className="text-sm text-stone">or click to browse — up to 10 images at once</p>
            </div>
            <p className="text-xs text-stone/50 mt-2">
              Works best with clear photos of covers or spines · JPEG, PNG, WebP
            </p>
          </div>
        )}
      </div>

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {previews.map((url, i) => (
            <img key={i} src={url} alt={`Preview ${i+1}`}
              className="h-24 w-auto rounded-lg object-cover border border-fog-dark shrink-0" />
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {scanned.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl text-ink">
                  {scanned.length} book{scanned.length > 1 ? 's' : ''} detected
                </h2>
                <p className="text-xs text-stone">{selected.size} selected for import</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm"
                  onClick={() => setSelected(new Set(scanned.map(b => b._id)))}>
                  Select All
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
                <Button
                  loading={importing}
                  onClick={handleImport}
                  disabled={selected.size === 0}
                >
                  <Plus size={13} />
                  Import {selected.size > 0 ? selected.size : ''} Book{selected.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {scanned.map((book, idx) => (
                  <BookPreviewCard
                    key={book._id}
                    book={book}
                    selected={selected.has(book._id)}
                    onToggle={() => toggleSelect(book._id)}
                    onEdit={() => handleEdit(idx)}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setScanned([]); setPreviews([]); setSelected(new Set()) }}>
                Clear Results
              </Button>
              <Button loading={importing} onClick={handleImport} disabled={selected.size === 0}>
                <Plus size={13} />
                Import {selected.size} Book{selected.size !== 1 ? 's' : ''} to Library
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editBook && (
        <EditModal
          book={editBook}
          onSave={handleSaveEdit}
          onClose={() => { setEditBook(null); setEditIdx(null) }}
        />
      )}
    </div>
  )
}
