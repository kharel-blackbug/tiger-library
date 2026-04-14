// DOM setup - includes jest-dom matchers
require('@testing-library/jest-dom')

global.fetch = jest.fn()
global.console.warn = jest.fn()

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

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})
