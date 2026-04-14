// Runs BEFORE jest framework — only mocks, no jest-dom
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
