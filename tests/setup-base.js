// Base setup - no jest-dom (for server tests)
global.fetch = jest.fn ? jest.fn() : undefined

const localStorageMock = (() => {
  let store = {}
  return {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k)    => { delete store[k] },
    clear:      ()     => { store = {} },
  }
})()

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
}

if (typeof beforeEach !== 'undefined') {
  beforeEach(() => {
    if (global.jest) {
      jest.clearAllMocks()
    }
  })
}
