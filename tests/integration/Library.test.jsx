// tests/integration/Library.test.jsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LibraryProvider, useLibrary } from '../../src/context/LibraryContext'
import Library from '../../src/pages/Library'
import toast from 'react-hot-toast'

jest.mock('@/api/client', () => ({
  api: {
    getBooks:    jest.fn(),
    getWishlist: jest.fn(),
    setStatus:   jest.fn(),
    deleteBook:  jest.fn(),
    addBook:     jest.fn(),
  },
}))

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin', display_name: 'Admin' },
    isAdmin: true,
    loading: false,
  }),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}))

jest.mock('../../src/components/AddBookModal', () => ({
  __esModule: true,
  default: ({ open }) => open ? <div data-testid="add-modal">Modal</div> : null,
}))

// Get mock reference AFTER jest.mock hoisting
const { api } = jest.requireMock('@/api/client')

const BOOKS = [
  { id: 'b1', title: 'Norwegian Wood',  author: 'Haruki Murakami',   genre: 'Fiction',  type: 'Fiction',     status: 'read',    rating: '4', is_sikkim: '0', is_base: '1', year: 1987, nation: '🇯🇵 Japan', description: 'A story of memory' },
  { id: 'b2', title: 'The Anarchy',     author: 'William Dalrymple', genre: 'History',   type: 'Non-Fiction', status: '',        rating: '5', is_sikkim: '0', is_base: '1', year: 2019, nation: '🇬🇧 UK',    description: 'East India Company' },
  { id: 'b3', title: 'Sikkim: Requiem', author: 'Andrew Duff',       genre: 'History',   type: 'Non-Fiction', status: 'reading', rating: '3', is_sikkim: '1', is_base: '1', year: 2008, nation: '🇬🇧 UK',    description: 'History of Sikkim' },
  { id: 'b4', title: 'My Local Book',   author: 'Local Author',      genre: 'Fiction',   type: 'Fiction',     status: '',        rating: '',  is_sikkim: '0', is_base: '0', year: 2023, nation: '🇮🇳 India', description: 'User added' },
]

function LibraryWrapper() {
  const { fetchBooks, fetchWishlist } = useLibrary()
  return (
    <div>
      <button data-testid="__trigger__" onClick={() => { fetchBooks(); fetchWishlist() }} style={{ display: 'none' }} />
      <Library />
    </div>
  )
}

async function renderLibrary() {
  render(<LibraryProvider><LibraryWrapper /></LibraryProvider>)
  await act(async () => { fireEvent.click(screen.getByTestId('__trigger__')) })
}

describe('Library — Search', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    api.getBooks.mockResolvedValue({ books: BOOKS })
    api.getWishlist.mockResolvedValue({ items: [] })
    api.setStatus.mockResolvedValue({ book: {} })
    api.deleteBook.mockResolvedValue({ ok: true })
  })
  afterEach(() => jest.useRealTimers())

  it('renders search input', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getByTestId('search-input')).toBeInTheDocument())
  })

  it('shows all books initially', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
  })

  it('filters by search after debounce', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Norwegian' } })
    act(() => jest.advanceTimersByTime(350))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(1))
    expect(screen.getByText('Norwegian Wood')).toBeInTheDocument()
  })

  it('shows empty state when no match', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zzznomatch123' } })
    act(() => jest.advanceTimersByTime(350))
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument())
  })

  it('searches by author', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Dalrymple' } })
    act(() => jest.advanceTimersByTime(350))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(1))
  })

  it('search is case insensitive', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'norwegian wood' } })
    act(() => jest.advanceTimersByTime(350))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(1))
  })

  it('clear restores all books', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Norwegian' } })
    act(() => jest.advanceTimersByTime(350))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(1))
    fireEvent.click(screen.getByTestId('search-clear'))
    act(() => jest.advanceTimersByTime(350))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
  })
})

describe('Library — Genre Filters', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    api.getBooks.mockResolvedValue({ books: BOOKS })
    api.getWishlist.mockResolvedValue({ items: [] })
  })
  afterEach(() => jest.useRealTimers())

  it('filters by Fiction', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.click(screen.getByTestId('genre-filter-Fiction'))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(2))
  })

  it('filters by History', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.click(screen.getByTestId('genre-filter-History'))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(2))
  })

  it('filters Sikkim', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.click(screen.getByTestId('genre-filter-sikkim'))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(1))
    expect(screen.getByText('Sikkim: Requiem')).toBeInTheDocument()
  })

  it('My Additions shows non-base books', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.click(screen.getByTestId('genre-filter-new'))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(1))
    expect(screen.getByText('My Local Book')).toBeInTheDocument()
  })

  it('All restores everything', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.click(screen.getByTestId('genre-filter-Fiction'))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(2))
    fireEvent.click(screen.getByTestId('genre-filter-all'))
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
  })

  it('active filter gets bamboo class', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    const btn = screen.getByTestId('genre-filter-Fiction')
    fireEvent.click(btn)
    await waitFor(() => expect(btn.className).toMatch(/bg-bamboo/))
  })
})

describe('Library — Add Book', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    api.getBooks.mockResolvedValue({ books: BOOKS })
    api.getWishlist.mockResolvedValue({ items: [] })
  })
  afterEach(() => jest.useRealTimers())

  it('Add Book opens modal', async () => {
    await renderLibrary()
    await waitFor(() => expect(screen.getAllByTestId('book-card').length).toBe(4))
    fireEvent.click(screen.getByText(/add book/i))
    expect(screen.getByTestId('add-modal')).toBeInTheDocument()
  })
})

describe('Library — Error handling', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('handles API failure with toast', async () => {
    api.getBooks.mockRejectedValue(new Error('Network error'))
    api.getWishlist.mockResolvedValue({ items: [] })
    await renderLibrary()
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('shows empty state with zero books', async () => {
    api.getBooks.mockResolvedValue({ books: [] })
    api.getWishlist.mockResolvedValue({ items: [] })
    await renderLibrary()
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument())
  })
})
