// src/components/Nav.jsx
import { useState } from 'react'
import { BookOpen, BarChart2, Heart, Target, Camera, Settings2, LogOut, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibrary } from '@/context/LibraryContext'
import { useAuth } from '@/context/AuthContext'

const TABS = [
  { id: 'library',   label: 'Library',   Icon: BookOpen,  adminOnly: false },
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart2, adminOnly: false },
  { id: 'goals',     label: 'Goals',     Icon: Target,    adminOnly: false },
  { id: 'wishlist',  label: 'Wishlist',  Icon: Heart,     adminOnly: false },
  { id: 'scan',      label: 'Scan',      Icon: Camera,    adminOnly: true  },
  { id: 'settings',  label: 'Settings',  Icon: Settings2, adminOnly: true  },
]

export default function Nav() {
  const { activeView, dispatch } = useLibrary()
  const { user, isAdmin, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin)

  const navigate = (id) => { dispatch({ type: 'SET_VIEW', payload: id }); setMobileOpen(false) }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-fog-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
          <div className="hidden sm:flex items-center flex-1">
            {visibleTabs.map(({ id, label, Icon }) => (
              <button key={id} data-testid={`nav-${id}`} onClick={() => navigate(id)}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-3.5 text-[10px] tracking-widest uppercase font-sans border-b-2 -mb-px transition-all whitespace-nowrap',
                  activeView === id ? 'text-bamboo border-bamboo' : 'text-stone border-transparent hover:text-ink hover:border-fog-dark'
                )}>
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-3 ml-auto py-2">
            <span className="text-xs text-stone">
              {user?.display_name || user?.username}
              {isAdmin && <span className="ml-1 text-[9px] bg-bamboo/10 text-bamboo px-1.5 py-0.5 rounded-full uppercase tracking-widest">admin</span>}
            </span>
            <button data-testid="logout-btn" onClick={logout} className="flex items-center gap-1 text-xs text-stone hover:text-red-500 transition-colors" title="Sign out">
              <LogOut size={13} />
            </button>
          </div>
          <button className="sm:hidden ml-auto py-3 text-stone hover:text-ink" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 z-30 sm:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-64 bg-white z-40 sm:hidden shadow-drawer flex flex-col">
              <div className="px-6 py-5 border-b border-fog-dark bg-bamboo-deeper">
                <p className="font-display text-white text-lg">Tiger's Library</p>
                <p className="text-white/40 text-xs mt-0.5">{user?.display_name || user?.username}{isAdmin && ' · Admin'}</p>
              </div>
              <div className="flex-1 py-2">
                {visibleTabs.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => navigate(id)}
                    className={clsx('w-full flex items-center gap-3 px-6 py-3 text-sm font-sans text-left transition-colors',
                      activeView === id ? 'text-bamboo bg-bamboo/5 border-r-2 border-bamboo' : 'text-stone hover:text-ink hover:bg-mist')}>
                    <Icon size={16} />{label}
                  </button>
                ))}
              </div>
              <div className="border-t border-fog-dark p-4">
                <button onClick={() => { logout(); setMobileOpen(false) }}
                  className="w-full flex items-center gap-2 text-sm text-stone hover:text-red-500 transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
