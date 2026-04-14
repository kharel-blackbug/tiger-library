// src/pages/Goals.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, X, Calendar, BookOpen, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { api } from '@/api/client'
import { useLibrary } from '@/context/LibraryContext'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CONFIG } from '@/config'
import toast from 'react-hot-toast'

dayjs.extend(relativeTime)

function GoalCard({ goal, books, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [completing, setCompleting] = useState(false)

  let bookIds = []
  try { bookIds = JSON.parse(goal.book_ids || '[]') } catch {}

  const goalBooks = bookIds.map(id => books.find(b => b.id === id)).filter(Boolean)
  const completed = goalBooks.filter(b => b.status === 'read').length
  const total     = goalBooks.length
  const pct       = total > 0 ? Math.round(completed / total * 100) : 0
  const daysLeft  = goal.target_date ? dayjs(goal.target_date).diff(dayjs(), 'day') : null
  const isOverdue = daysLeft !== null && daysLeft < 0

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await onUpdate(goal.id, { status: 'completed' })
      toast.success('Goal marked as completed! 🎉')
    } finally { setCompleting(false) }
  }

  const statusColors = {
    active:    'bg-bamboo/10 text-bamboo border-bamboo/20',
    completed: 'bg-green-50 text-green-700 border-green-200',
    abandoned: 'bg-stone/10 text-stone border-stone/20',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white border border-fog-dark rounded-2xl overflow-hidden hover:shadow-card transition-shadow"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg text-ink font-medium">{goal.name}</h3>
              <span className={`text-[9px] tracking-widest uppercase border px-2 py-0.5 rounded-full ${statusColors[goal.status] || statusColors.active}`}>
                {goal.status}
              </span>
            </div>
            {goal.description && (
              <p className="text-sm text-stone mt-0.5 line-clamp-2">{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {goal.status === 'active' && (
              <Button variant="ghost" size="xs" loading={completing} onClick={handleComplete}
                className="text-bamboo hover:bg-bamboo/10" title="Mark complete">
                <Check size={12} />
              </Button>
            )}
            <Button variant="ghost" size="xs" onClick={() => onDelete(goal.id)}
              className="text-stone hover:text-red-500">
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-stone mb-1.5">
            <span>{completed} of {total} books read</span>
            <span className="font-medium text-bamboo">{pct}%</span>
          </div>
          <div className="h-2 bg-fog rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-bamboo to-slate'}`}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-stone flex-wrap">
          {goal.target_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
              <Calendar size={11} />
              {isOverdue
                ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`
                : daysLeft === 0 ? 'Due today'
                : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
            </div>
          )}
          <div className="flex items-center gap-1">
            <BookOpen size={11} />
            {total} book{total !== 1 ? 's' : ''}
          </div>
          <span>by {goal.owner}</span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[10px] tracking-widest uppercase text-stone/50 hover:text-stone flex items-center gap-1 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide' : 'Show'} books
        </button>
      </div>

      {/* Book list */}
      <AnimatePresence>
        {expanded && goalBooks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-fog-dark overflow-hidden"
          >
            {goalBooks.map(book => (
              <div key={book.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-mist transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${book.status === 'read' ? 'bg-bamboo' : book.status === 'reading' ? 'bg-slate' : 'bg-fog-dark'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-serif text-ink truncate">{book.title}</div>
                  <div className="text-xs text-stone italic">{book.author}</div>
                </div>
                {book.status && (
                  <span className={`text-[9px] tracking-wide uppercase px-2 py-0.5 rounded-full ${CONFIG.statusMap[book.status]?.color || ''}`}>
                    {CONFIG.statusMap[book.status]?.label || book.status}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AddGoalModal({ books, onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', target_date: '', book_ids: [] })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = books.filter(b =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => {
    setForm(f => ({
      ...f,
      book_ids: f.book_ids.includes(id)
        ? f.book_ids.filter(x => x !== id)
        : [...f.book_ids, id]
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Give this goal a name'); return }
    if (!form.book_ids.length) { toast.error('Select at least one book'); return }
    setSaving(true)
    try {
      await onAdd(form)
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-modal w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-fog-dark bg-bamboo-deeper rounded-t-2xl flex justify-between items-center shrink-0">
          <h2 className="font-display text-xl text-white">New Reading Goal</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Input label="Goal Name *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Read 10 Sikkim books this year" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium tracking-widest uppercase text-stone">Description</label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What's this goal about?" rows={2}
              className="w-full px-3 py-2.5 text-sm border border-fog-dark rounded-md text-ink focus:outline-none focus:border-bamboo resize-none" />
          </div>
          <Input label="Target Date" type="date" value={form.target_date}
            onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
            min={dayjs().format('YYYY-MM-DD')} />

          <div>
            <label className="text-xs font-medium tracking-widest uppercase text-stone block mb-2">
              Select Books * ({form.book_ids.length} selected)
            </label>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search your library…"
              className="w-full px-3 py-2 text-sm border border-fog-dark rounded-lg mb-2 focus:outline-none focus:border-bamboo"
            />
            <div className="max-h-64 overflow-y-auto border border-fog-dark rounded-xl divide-y divide-fog-dark">
              {filtered.slice(0, 50).map(book => (
                <label key={book.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-mist cursor-pointer transition-colors">
                  <input type="checkbox" className="accent-bamboo shrink-0"
                    checked={form.book_ids.includes(book.id)}
                    onChange={() => toggle(book.id)} />
                  <div className="min-w-0">
                    <div className="text-sm font-serif text-ink truncate">{book.title}</div>
                    <div className="text-xs text-stone italic">{book.author}</div>
                  </div>
                  {book.status === 'read' && <Check size={12} className="text-bamboo shrink-0" />}
                </label>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-stone italic">No books match</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-fog-dark bg-mist rounded-b-2xl shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={handleSave}>
            <Target size={13} /> Create Goal
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Goals() {
  const { books } = useLibrary()
  const { isAdmin } = useAuth()
  const [goals, setGoals]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [filter, setFilter]   = useState('active')

  useEffect(() => {
    api.getGoals()
      .then(d => setGoals(d.goals || []))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (form) => {
    const data = await api.addGoal(form)
    setGoals(prev => [data.goal, ...prev])
    toast.success('Reading goal created!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    await api.deleteGoal(id)
    setGoals(prev => prev.filter(g => g.id !== id))
    toast.success('Goal deleted')
  }

  const handleUpdate = async (id, updates) => {
    const data = await api.updateGoal(id, updates)
    setGoals(prev => prev.map(g => g.id === id ? data.goal : g))
  }

  const filtered = goals.filter(g => filter === 'all' ? true : g.status === filter)

  // Summary stats
  const active    = goals.filter(g => g.status === 'active').length
  const completed = goals.filter(g => g.status === 'completed').length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink mb-1 flex items-center gap-3">
            <Target className="text-bamboo" size={28} /> Reading Goals
          </h1>
          <p className="text-sm text-stone">
            {active} active · {completed} completed
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setModal(true)}>
            <Plus size={13} /> New Goal
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[['active','Active'],['completed','Completed'],['all','All']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 text-xs tracking-widest uppercase rounded-full border font-sans transition-all ${
              filter === val ? 'bg-bamboo text-white border-bamboo' : 'border-fog-dark text-stone hover:border-bamboo/40'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-fog-dark border-t-bamboo rounded-full animate-spin mx-auto mb-3" />
          <p className="font-serif italic text-stone">Loading goals…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Target size={48} className="text-stone/20 mx-auto mb-4" />
          <p className="font-serif italic text-stone text-lg mb-2">No reading goals yet</p>
          <p className="text-xs text-stone/60 mb-6">
            Set ambitious reading targets and track your progress
          </p>
          {isAdmin && (
            <Button variant="outline" onClick={() => setModal(true)}>
              <Plus size={13} /> Create Your First Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                books={books}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {modal && (
        <AddGoalModal
          books={books}
          onAdd={handleAdd}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  )
}
