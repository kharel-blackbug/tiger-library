// src/hooks/index.js
import { useState, useEffect, useRef, useCallback } from 'react'

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(initial)) }
    catch { return initial }
  })
  const set = useCallback(v => {
    setVal(v)
    localStorage.setItem(key, JSON.stringify(v))
  }, [key])
  return [val, set]
}

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: false, error: null, data: null })
  const execute = useCallback(async (...args) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn(...args)
      setState({ loading: false, error: null, data })
      return data
    } catch (e) {
      setState({ loading: false, error: e.message, data: null })
      throw e
    }
  }, deps)
  return { ...state, execute }
}

export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = e => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler(e)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

export function useKeyPress(key, handler) {
  useEffect(() => {
    const listener = e => { if (e.key === key) handler(e) }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [key, handler])
}

export function useLockScroll(locked) {
  useEffect(() => {
    if (locked) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [locked])
}
