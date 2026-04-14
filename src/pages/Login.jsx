// src/pages/Login.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPw, setShowPw]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Enter username and password'); return }
    setLoading(true); setError('')
    try {
      await login(form.username, form.password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bamboo-deeper via-bamboo-dark to-slate-deeper flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="font-display text-4xl font-bold text-white leading-none mb-1">Tiger's</h1>
          <h1 className="font-display text-4xl font-bold text-white/40 italic leading-none">Library</h1>
          <p className="text-white/30 text-xs tracking-[4px] uppercase mt-3">Tashiling · Gangtok</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={14} className="text-white/50" />
            <span className="text-white/60 text-xs tracking-widest uppercase">Admin Access</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                data-testid="login-username"
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-sm"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <input
                data-testid="login-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-10 text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2 text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              data-testid="login-submit"
              type="submit"
              loading={loading}
              className="w-full bg-white text-bamboo-deeper hover:bg-white/90 font-semibold py-3 rounded-lg transition-all"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-white/20 text-xs text-center mt-4">
            Default: admin / changeme123
          </p>
        </div>
      </motion.div>
    </div>
  )
}
