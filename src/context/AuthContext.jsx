// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const init = { user: null, loading: true, sheetsConnected: false }

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':    return { ...state, user: action.payload, loading: false }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_SHEETS':  return { ...state, sheetsConnected: action.payload }
    case 'LOGOUT':      return { ...init, loading: false }
    default:            return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  const checkMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await res.json().catch(() => ({}))

      // Must have a valid user object with id AND role to be considered logged in.
      // An empty object {} from a stale JWT must NOT count as authenticated.
      if (res.ok && data.user && data.user.id && data.user.role) {
        dispatch({ type: 'SET_USER', payload: data.user })
        try {
          const sr = await fetch('/api/auth/sheets/status', { credentials: 'include' })
          if (sr.ok) {
            const sd = await sr.json()
            dispatch({ type: 'SET_SHEETS', payload: !!sd.connected })
          }
        } catch (_) {
          // Sheets status failure is non-fatal
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null })
      }
    } catch (_) {
      // Network error — server not running yet
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  useEffect(() => { checkMe() }, [checkMe])

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    dispatch({ type: 'SET_USER', payload: data.user })
    toast.success(`Welcome back, ${data.user.display_name || data.user.username}!`)
    await checkMe()
    return data.user
  }, [checkMe])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out')
  }, [])

  const isAdmin = state.user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ ...state, isAdmin, login, logout, checkMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
