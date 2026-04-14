// src/pages/Wishlist.jsx
import { useState } from 'react'
import { Plus, Heart, ArrowRight, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useLibrary } from '@/context/LibraryContext'
import { CONFIG } from '@/config'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useKeyPress, useLockScroll } from '@/hooks'

function AddWishModal({ open, onClose }) {
  const { addWish } = useLibrary()
  const [form, setForm] = useState({ title: '', author: '', genre: '', priority: 'medium' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useLockScroll(open)
  useKeyPress('Escape', onClose)

  if (!open) return null

  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.title.trim()) { setErrors({ title: 'Title required' }); return }
    setErrors({})
    setSaving(true)
    try {
      await addWish({ ...form, genre: form.genre || 'Non-Fiction' })
      setForm({ title: '', author: '', genre: '', priority: 'medium' })
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-modal w-full max-w-md pointer-events-auto animate-fade-up">
          <div className="px-6 py-4 border-b border-fog-dark bg-cedar rounded-t-xl flex justify-between items-center">
            <div>
              <p className="text-[9px] tracking-widest uppercase text-white/40">Reading Wishlist</p>
              <h2 className="font-display text-xl text-white">Add to Wishlist</h2>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <Input label="Title *" value={form.title} onChange={f('title')} error={errors.title} placeholder="e.g. The Remains of the Day" />
            <Input label="Author" value={form.author} onChange={f('author')} placeholder="e.g. Kazuo Ishiguro" />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Genre" value={form.genre} onChange={f('genre')}>
                <option value="">— Select —</option>
                {CONFIG.genres.map(g => <option key={g}>{g}</option>)}
              </Select>
              <Select label="Priority" value={form.priority} onChange={f('priority')}>
                <option value="high">🔴 High — Read Soon</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low — Someday</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 px-6 py-4 border-t border-fog-dark bg-mist rounded-b-xl">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              <Heart size={13} /> Add to Wishlist
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Wishlist() {
  const { wishlist, removeWish, moveWishToLibrary, dispatch } = useLibrary()
  const [modalOpen, setModalOpen] = useState(false)
  const [movingId, setMovingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  const handleMove = async (id) => {
    setMovingId(id)
    try { await moveWishToLibrary(id) }
    finally { setMovingId(null) }
  }

  const handleRemove = async (id) => {
    setRemovingId(id)
    try { await removeWish(id) }
    finally { setRemovingId(null) }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...wishlist].sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-ink">
        <div>
          <h1 className="font-display text-3xl text-ink">Reading Wishlist</h1>
          <p className="text-xs text-stone mt-1">{wishlist.length} book{wishlist.length !== 1 ? 's' : ''} on your list</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={13} /> Add Book
        </Button>
      </div>

      {wishlist.length === 0 ? (
        <div data-testid="wishlist-empty" className="py-24 text-center">
          <div className="text-5xl mb-4 opacity-20">❤️</div>
          <p className="font-serif italic text-stone text-lg mb-2">Your wishlist is empty</p>
          <p className="text-xs text-stone/60 mb-6">Add books you want to read next</p>
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            <Plus size={13} /> Add First Book
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((w, i) => {
            const pri = CONFIG.priorityMap[w.priority] || CONFIG.priorityMap.medium
            const coverUrl = `${CONFIG.ui.coverBaseUrl}/${encodeURIComponent(w.title)}-S.jpg`
            return (
              <div
                key={w.id}
                data-testid="wishlist-card"
                className="bg-white border border-fog-dark rounded-lg p-4 flex gap-4 items-center hover:border-bamboo/30 hover:shadow-card transition-all animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <img
                  src={coverUrl}
                  alt={w.title}
                  className="w-10 h-14 object-cover rounded shrink-0 grayscale-[30%]"
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-serif font-medium text-ink text-sm leading-snug">{w.title}</span>
                    <span className={clsx('text-[10px] shrink-0 font-medium', pri.color)}>{pri.label}</span>
                  </div>
                  {w.author && <div className="text-xs text-stone italic">{w.author}</div>}
                  {w.genre && <div className="text-[10px] text-stone/60 mt-0.5">{w.genre}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="xs"
                    loading={movingId === w.id}
                    onClick={() => handleMove(w.id)}
                    title="Move to library"
                  >
                    <ArrowRight size={11} />
                    <span className="hidden sm:inline">To Library</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    loading={removingId === w.id}
                    onClick={() => handleRemove(w.id)}
                    className="text-stone hover:text-red-500"
                  >
                    <Trash2 size={11} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddWishModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
