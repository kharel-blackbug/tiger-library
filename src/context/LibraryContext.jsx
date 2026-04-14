// src/context/LibraryContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/api/client'

const LibraryContext = createContext(null)

const initialState = {
  books: [], wishlist: [], loading: false, error: null,
  activeView: 'library', activeGenre: 'all', searchQuery: '',
  sortBy: 'title', viewMode: 'grid',
  drawer: { open: false, bookId: null, tab: 'about' },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':    return { ...state, loading: action.payload }
    case 'SET_BOOKS':      return { ...state, books: action.payload, loading: false }
    case 'SET_WISHLIST':   return { ...state, wishlist: action.payload }
    case 'SET_VIEW':       return { ...state, activeView: action.payload }
    case 'SET_GENRE':      return { ...state, activeGenre: action.payload }
    case 'SET_SEARCH':     return { ...state, searchQuery: action.payload }
    case 'SET_SORT':       return { ...state, sortBy: action.payload }
    case 'SET_VIEW_MODE':  return { ...state, viewMode: action.payload }
    case 'OPEN_DRAWER':    return { ...state, drawer: { open: true, bookId: action.payload.bookId, tab: action.payload.tab || 'about' } }
    case 'CLOSE_DRAWER':   return { ...state, drawer: { ...state.drawer, open: false } }
    case 'SET_DRAWER_TAB': return { ...state, drawer: { ...state.drawer, tab: action.payload } }
    case 'UPDATE_BOOK':    return { ...state, books: state.books.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) }
    case 'ADD_BOOK':       return { ...state, books: [action.payload, ...state.books] }
    case 'REMOVE_BOOK':    return { ...state, books: state.books.filter(b => b.id !== action.payload) }
    case 'ADD_WISH':       return { ...state, wishlist: [action.payload, ...state.wishlist] }
    case 'REMOVE_WISH':    return { ...state, wishlist: state.wishlist.filter(w => w.id !== action.payload) }
    default:               return state
  }
}

export function LibraryProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchBooks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const data = await api.getBooks()
      dispatch({ type: 'SET_BOOKS', payload: data.books || [] })
    } catch (e) {
      dispatch({ type: 'SET_LOADING', payload: false })
      if (!e.message.includes('not configured')) toast.error('Could not load books')
    }
  }, [])

  const fetchWishlist = useCallback(async () => {
    try {
      const data = await api.getWishlist()
      dispatch({ type: 'SET_WISHLIST', payload: data.items || [] })
    } catch {}
  }, [])

  const setStatus = useCallback(async (id, status) => {
    const book = state.books.find(b => b.id === id)
    const newStatus = book?.status === status ? '' : status
    dispatch({ type: 'UPDATE_BOOK', payload: { id, status: newStatus } })
    try {
      await api.setStatus(id, { status: newStatus })
      toast.success('Status updated')
    } catch (e) {
      dispatch({ type: 'UPDATE_BOOK', payload: { id, status: book?.status } })
      toast.error(e.message)
    }
  }, [state.books])

  const rateBook = useCallback(async (id, rating, status) => {
    try {
      await api.setStatus(id, { rating: String(rating), status })
      dispatch({ type: 'UPDATE_BOOK', payload: { id, rating: String(rating), status } })
      toast.success('Rating saved')
    } catch (e) { toast.error(e.message) }
  }, [])

  const saveReview = useCallback(async (id, review) => {
    await api.saveReview(id, { review })
    dispatch({ type: 'UPDATE_BOOK', payload: { id, review, review_date: new Date().toISOString() } })
  }, [])

  const saveProgress = useCallback(async (id, progress) => {
    await api.saveProgress(id, progress)
    dispatch({ type: 'UPDATE_BOOK', payload: { id, ...progress } })
  }, [])

  const addBook = useCallback(async (data) => {
    const result = await api.addBook(data)
    dispatch({ type: 'ADD_BOOK', payload: result.book })
    toast.success(`"${result.book.title}" added`)
    return result.book
  }, [])

  const updateBook = useCallback(async (id, data) => {
    const result = await api.updateBook(id, data)
    dispatch({ type: 'UPDATE_BOOK', payload: result.book })
    toast.success('Book updated')
  }, [])

  const deleteBook = useCallback(async (id) => {
    await api.deleteBook(id)
    dispatch({ type: 'REMOVE_BOOK', payload: id })
    toast.success('Book removed')
  }, [])

  const addWish = useCallback(async (data) => {
    const result = await api.addWish(data)
    dispatch({ type: 'ADD_WISH', payload: result.item })
    toast.success(`Added to wishlist`)
  }, [])

  const removeWish = useCallback(async (id) => {
    dispatch({ type: 'REMOVE_WISH', payload: id })
    await api.deleteWish(id).catch(() => {})
    toast.success('Removed from wishlist')
  }, [])

  const moveWishToLibrary = useCallback(async (id) => {
    const result = await api.moveToLib(id)
    dispatch({ type: 'REMOVE_WISH', payload: id })
    dispatch({ type: 'ADD_BOOK', payload: result.book })
    toast.success('Moved to library')
  }, [])

  const filteredBooks = (() => {
    let list = state.books
    if (state.activeGenre === 'sikkim') list = list.filter(b => b.is_sikkim === '1' || b.is_sikkim === true)
    else if (state.activeGenre === 'new') list = list.filter(b => !b.is_base || b.is_base === '0')
    else if (state.activeGenre !== 'all') list = list.filter(b => b.genre === state.activeGenre)
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase()
      list = list.filter(b => ['title','author','genre','nation','description'].some(f => (b[f]||'').toLowerCase().includes(q)))
    }
    return [...list].sort((a, b) => {
      const av = (a[state.sortBy] || '').toString().toLowerCase()
      const bv = (b[state.sortBy] || '').toString().toLowerCase()
      return av < bv ? -1 : av > bv ? 1 : 0
    })
  })()

  const activeBook = state.books.find(b => b.id === state.drawer.bookId) || null

  return (
    <LibraryContext.Provider value={{
      ...state, filteredBooks, activeBook, dispatch,
      fetchBooks, fetchWishlist, setStatus, rateBook, saveReview,
      saveProgress, addBook, updateBook, deleteBook, addWish, removeWish, moveWishToLibrary,
    }}>
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
