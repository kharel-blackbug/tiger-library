// src/App.jsx
import { useEffect } from 'react'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { useLibrary } from '@/context/LibraryContext'
import { useAuth } from '@/context/AuthContext'
import Hero from '@/components/Hero'
import Nav from '@/components/Nav'
import BookDrawer from '@/components/BookDrawer'
import Library from '@/pages/Library'
import Dashboard from '@/pages/Dashboard'
import Wishlist from '@/pages/Wishlist'
import Goals from '@/pages/Goals'
import BookScan from '@/pages/BookScan'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import AddBookModal from '@/components/AddBookModal'

const ADMIN_PAGES = { scan: BookScan, settings: Settings }
const ALL_PAGES   = { library: Library, dashboard: Dashboard, wishlist: Wishlist, goals: Goals }

function AppShell() {
  const { activeView, loading: libLoading, fetchBooks, fetchWishlist, dispatch } = useLibrary()
  const { sheetsConnected, isAdmin } = useAuth()
  const [editBook, setEditBook] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  // If viewer tries to access admin-only page, redirect to library
  useEffect(() => {
    if (!isAdmin && (activeView === 'settings' || activeView === 'scan')) {
      dispatch({ type: 'SET_VIEW', payload: 'library' })
    }
  }, [activeView, isAdmin, dispatch])

  useEffect(() => {
    if (sheetsConnected) {
      fetchBooks()
      fetchWishlist()
    }
  }, [sheetsConnected])

  // Resolve page component — admin gets extra pages
  const pageMap = isAdmin ? { ...ALL_PAGES, ...ADMIN_PAGES } : ALL_PAGES
  const PageComponent = pageMap[activeView] || Library

  return (
    <div className="min-h-screen bg-parchment font-sans text-ink">
      <Hero />
      <Nav />

      {/* Only show "connect sheet" banner to admin — viewers just see empty state */}
      {isAdmin && !sheetsConnected && activeView !== 'settings' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
          ⚠ Google Sheet not connected —{' '}
          <button
            className="underline font-medium"
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })}
          >
            go to Settings
          </button>
          {' '}to connect your Sheet.
        </div>
      )}

      <main className="relative">
        {libLoading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-fog-dark border-t-bamboo rounded-full animate-spin" />
              <p className="font-serif italic text-stone text-sm">Loading your library…</p>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="text-center py-6 text-[9px] tracking-[4px] uppercase border-t border-fog-dark bg-bamboo-deeper text-white/30 font-sans">
        Tiger's Library · Queenbridge, Gangtok, Sikkim
      </footer>

      <BookDrawer
        onEdit={b => { if (isAdmin) { setEditBook(b); setEditOpen(true) } }}
        onDelete={() => {}}
      />

      {isAdmin && (
        <AddBookModal
          open={editOpen}
          onClose={() => { setEditOpen(false); setEditBook(null) }}
          editBook={editBook}
        />
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-9 h-9 bg-bamboo text-white rounded-full shadow-lg flex items-center justify-center hover:bg-bamboo-dark transition-colors z-30 text-sm"
      >↑</button>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', borderRadius: '8px', background: '#2d4a3e', color: '#fff' },
          error: { style: { background: '#991b1b' } },
        }}
      />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bamboo-deeper flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-sans">Tiger's Library…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />
  return <AppShell />
}
