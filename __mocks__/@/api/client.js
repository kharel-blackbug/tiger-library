// Jest mock for src/api/client.js — replaces import.meta.env with jest.fn()
const api = {
  login:        jest.fn(), logout:       jest.fn(), me:           jest.fn(),
  changePass:   jest.fn(), connectSheet: jest.fn(), sheetStatus:  jest.fn(),
  getBooks:     jest.fn(), getBook:      jest.fn(), addBook:      jest.fn(),
  updateBook:   jest.fn(), deleteBook:   jest.fn(), setStatus:    jest.fn(),
  saveReview:   jest.fn(), saveProgress: jest.fn(), bulkImport:   jest.fn(),
  getQuotes:    jest.fn(), addQuote:     jest.fn(), deleteQuote:  jest.fn(),
  getWishlist:  jest.fn(), addWish:      jest.fn(), deleteWish:   jest.fn(),
  moveToLib:    jest.fn(), getGoals:     jest.fn(), addGoal:      jest.fn(),
  updateGoal:   jest.fn(), deleteGoal:   jest.fn(), scanImages:   jest.fn(),
  lookupBook:   jest.fn(), getStats:     jest.fn(),
}
module.exports = { api }
