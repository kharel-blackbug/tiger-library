// Runs AFTER jest framework is injected — safe to use expect/jest globals
require('@testing-library/jest-dom')

global.fetch = jest.fn()
global.console.warn = jest.fn()

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})
