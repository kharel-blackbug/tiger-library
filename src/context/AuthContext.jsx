// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/api/client'

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
      // Use api.me() so the Railway base URL is applied correctly in production
      const data = await api.me()
      if (data.user && data.user.id && data.user.role) {
        dispatch({ type: 'SET_USER', payload: data.user })
        try {
          const sd = await api.sheetStatus()
          dispatch({ type: 'SET_SHEETS', payload: !!sd.connected })
        } catch (_) {
          // Sheets status failure is non-fatal
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null })
      }
    } catch (_) {
      // 401 or network error — not logged in
      dispatch({ type: 'SET_USER', payload: null })
    }
  }, [])

  useEffect(() => { checkMe() }, [checkMe])

  const login = useCallback(async (username, password) => {
    const data = await api.login({ username, password })
    // Store token in localStorage as Authorization header fallback
    // (cross-origin cookies can be blocked by browsers)
    if (data.token) {
      try { localStorage.setItem('tl_token', data.token) } catch (_) {}
    }
    dispatch({ type: 'SET_USER', payload: data.user })
    toast.success(`Welcome back, ${data.user.display_name || data.user.username}!`)
    await checkMe()
    return data.user
  }, [checkMe])

  const logout = useCallback(async () => {
    try { await api.logout() } catch (_) {}
    try { localStorage.removeItem('tl_token') } catch (_) {}
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
