// tests/setup.js
require('@testing-library/jest-dom')

// Silence console.warn in tests
global.console.warn = jest.fn()

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Reset between tests
beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})
