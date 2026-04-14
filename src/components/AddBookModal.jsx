// src/components/AddBookModal.jsx
import { useState } from 'react'
import { X, Sparkles, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useLibrary } from '@/context/LibraryContext'
import { useKeyPress, useLockScroll } from '@/hooks'
import { CONFIG } from '@/config'
import { api } from '@/api/client'
import Button from './ui/Button'
import { Input, Select, Textarea } from './ui/Input'
import toast from 'react-hot-toast'

export default function AddBookModal({ open, onClose, editBook = null }) {
  const { addBook, updateBook } = useLibrary()
  const [step, setStep] = useState('lookup')   // 'lookup' | 'manual'
  const [lookupTitle, setLookupTitle] = useState('')
  const [lookupAuthor, setLookupAuthor] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchedData, setFetchedData] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(editBook ? {
    title: editBook.title, author: editBook.author, genre: editBook.genre,
    type: editBook.type, year: editBook.year || '', nation: editBook.nation || '',
    description: editBook.description || '', is_sikkim: !!editBook.is_sikkim,
  } : { title: '', author: '', genre: '', type: '', year: '', nation: '', description: '', is_sikkim: false })
  const [errors, setErrors] = useState({})

  useLockScroll(open)
  useKeyPress('Escape', onClose)

  if (!open) return null

  const isEdit = !!editBook

  const handleFetch = async () => {
    if (!lookupTitle.trim()) return
    setFetching(true)
    setFetchError('')
    setFetchedData(null)
    try {
      const data = await api.aiLookup({ title: lookupTitle, author: lookupAuthor })
      setFetchedData(data)
    } catch (e) {
      setFetchError(e.message.includes('Unknown action')
        ? 'AI lookup unavailable — please add book manually.'
        : e.message)
    } finally { setFetching(false) }
  }

  const applyFetched = () => {
    setForm({
      title: fetchedData.title || '',
      author: fetchedData.author || '',
      genre: fetchedData.genre || '',
      type: fetchedData.type || '',
      year: fetchedData.year || '',
      nation: fetchedData.nation || '',
      description: fetchedData.desc || '',
      is_sikkim: false,
    })
    setStep('manual')
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.author.trim()) e.author = 'Author is required'
    if (!form.genre) e.genre = 'Select a genre'
    if (!form.type) e.type = 'Select fiction or non-fiction'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, year: form.year ? parseInt(form.year) : null }
      if (isEdit) await updateBook(editBook.id, payload)
      else await addBook(payload)
      onClose()
    } catch (e) {
      toast.error(e.message)
    } finally { setSaving(false) }
  }

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <>
      <div className="fixed inset-0 bg-ink/50 z-50 animate-fade-in flex items-center justify-center p-4" onClick={onClose} />
      <div
        data-testid="add-book-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-xl shadow-modal w-full max-w-lg max-h-[90vh] flex flex-col pointer-events-auto animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-fog-dark shrink-0 bg-bamboo-deeper rounded-t-xl">
            <div>
              <p className="text-[9px] tracking-widest uppercase text-white/40">{isEdit ? 'Edit Volume' : 'New Volume'}</p>
              <h2 className="font-display text-xl text-white">{isEdit ? 'Update Details' : 'Add to Collection'}</h2>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Lookup step */}
            {!isEdit && step === 'lookup' && (
              <div className="space-y-4">
                <p className="text-sm text-stone leading-relaxed">
                  Type a title and let AI fill in the details — or{' '}
                  <button onClick={() => setStep('manual')} className="text-bamboo underline hover:text-bamboo-dark">add manually</button>.
                </p>
                <Input label="Book Title *" placeholder="e.g. Norwegian Wood" value={lookupTitle} onChange={e => setLookupTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetch()} />
                <Input label="Author (optional)" placeholder="e.g. Haruki Murakami" value={lookupAuthor} onChange={e => setLookupAuthor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetch()} />

                <Button loading={fetching} onClick={handleFetch} disabled={!lookupTitle.trim()} className="w-full">
                  <Sparkles size={14} /> Fetch Details with AI
                </Button>

                {fetchError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">{fetchError}</div>
                )}

                {fetchedData && (
                  <div className="bg-bamboo/5 border border-bamboo/20 rounded-lg p-4 space-y-2">
                    <h3 className="font-display text-lg text-ink">{fetchedData.title}</h3>
                    <p className="text-xs text-stone italic">{fetchedData.author}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[fetchedData.genre, fetchedData.type, fetchedData.nation].filter(Boolean).map(tag => (
                        <span key={tag} className="text-[9px] tracking-widest uppercase border border-fog-dark px-2 py-0.5 rounded text-stone">{tag}</span>
                      ))}
                    </div>
                    <p className="text-xs text-stone leading-relaxed">{fetchedData.desc}</p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={applyFetched} className="flex-1">
                        <ChevronRight size={12} /> Use This
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setFetchedData(null)}>Try Again</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual form */}
            {(isEdit || step === 'manual') && (
              <div className="space-y-4">
                {!isEdit && (
                  <button onClick={() => setStep('lookup')} className="text-xs text-bamboo hover:text-bamboo-dark flex items-center gap-1">
                    ← Back to AI lookup
                  </button>
                )}
                <Input label="Title *" value={form.title} onChange={f('title')} error={errors.title} placeholder="Book title" />
                <Input label="Author *" value={form.author} onChange={f('author')} error={errors.author} placeholder="Author name" />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Genre *" value={form.genre} onChange={f('genre')} error={errors.genre}>
                    <option value="">— Select —</option>
                    {CONFIG.genres.map(g => <option key={g}>{g}</option>)}
                  </Select>
                  <Select label="Type *" value={form.type} onChange={f('type')} error={errors.type}>
                    <option value="">— Select —</option>
                    <option>Fiction</option>
                    <option>Non-Fiction</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Year" type="number" value={form.year} onChange={f('year')} placeholder="e.g. 1987" />
                  <Input label="Nation" value={form.nation} onChange={f('nation')} placeholder="e.g. 🇯🇵 Japan" />
                </div>
                <Textarea label="Description" value={form.description} onChange={f('description')} rows={3} placeholder="A brief description…" />
                <label className="flex items-center gap-2 text-sm text-stone cursor-pointer">
                  <input type="checkbox" checked={form.is_sikkim} onChange={f('is_sikkim')} className="accent-bamboo rounded" />
                  Add to Sikkim Collection 🏔
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          {(isEdit || step === 'manual') && (
            <div className="flex gap-2 px-6 py-4 border-t border-fog-dark shrink-0 bg-mist rounded-b-xl">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button loading={saving} onClick={handleSave} className="flex-1">
                {isEdit ? 'Update Book' : 'Add to Library'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
