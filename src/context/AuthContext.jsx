// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/api/client'

const AuthContext = createContext(null)
const SHEET_STORAGE_KEY = 'tl_sheet_config'

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

// Save sheet config to localStorage so it survives server restarts
function saveSheetConfig(sheet_id, credentials) {
  try { localStorage.setItem(SHEET_STORAGE_KEY, JSON.stringify({ sheet_id, credentials })) } catch (_) {}
}

// Get saved sheet config from localStorage
function getSavedSheetConfig() {
  try {
    const raw = localStorage.getItem(SHEET_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) { return null }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init)

  // Reconnect sheet from localStorage if server DB was reset
  const reconnectSheetIfNeeded = useCallback(async () => {
    try {
      const status = await api.sheetStatus()
      if (status.connected) {
        dispatch({ type: 'SET_SHEETS', payload: true })
        return
      }
      // Not connected — try to restore from localStorage
      const saved = getSavedSheetConfig()
      if (saved?.sheet_id && saved?.credentials) {
        try {
          await api.connectSheet({ sheet_id: saved.sheet_id, credentials: saved.credentials })
          dispatch({ type: 'SET_SHEETS', payload: true })
        } catch (_) {
          dispatch({ type: 'SET_SHEETS', payload: false })
        }
      } else {
        dispatch({ type: 'SET_SHEETS', payload: false })
      }
    } catch (_) {
      dispatch({ type: 'SET_SHEETS', payload: false })
    }
  }, [])

  const checkMe = useCallback(async () => {
    try {
      const data = await api.me()
      if (data.user && data.user.id && data.user.role) {
        dispatch({ type: 'SET_USER', payload: data.user })
        await reconnectSheetIfNeeded()
      } else {
        dispatch({ type: 'SET_USER', payload: null })
      }
    } catch (_) {
      dispatch({ type: 'SET_USER', payload: null })
    }
  }, [reconnectSheetIfNeeded])

  useEffect(() => { checkMe() }, [checkMe])

  const login = useCallback(async (username, password) => {
    const data = await api.login({ username, password })
    if (data.token) {
      try { localStorage.setItem('tl_token', data.token) } catch (_) {}
    }
    dispatch({ type: 'SET_USER', payload: data.user })
    toast.success(`Welcome back, ${data.user.display_name || data.user.username}!`)
    await reconnectSheetIfNeeded()
    return data.user
  }, [reconnectSheetIfNeeded])

  const logout = useCallback(async () => {
    try { await api.logout() } catch (_) {}
    try { localStorage.removeItem('tl_token') } catch (_) {}
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out')
  }, [])

  const isAdmin  = state.user?.role === 'admin'
  const isViewer = state.user?.role === 'viewer'

  return (
    <AuthContext.Provider value={{
      ...state, isAdmin, isViewer,
      login, logout, checkMe,
      saveSheetConfig,   // expose so Settings can save config after connecting
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
