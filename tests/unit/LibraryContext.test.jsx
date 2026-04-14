// tests/unit/LibraryContext.test.jsx
import { render, screen, act, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { LibraryProvider, useLibrary } from '../../src/context/LibraryContext'

// jest.mock is hoisted before all imports/variables.
// Factory runs at hoist time so we use jest.fn() directly here.
jest.mock('@/api/client', () => ({
  api: {
    getBooks:    jest.fn(),
    getWishlist: jest.fn(),
    setStatus:   jest.fn(),
    saveReview:  jest.fn(),
    addBook:     jest.fn(),
    deleteBook:  jest.fn(),
    addWish:     jest.fn(),
    deleteWish:  jest.fn(),
    moveToLib:   jest.fn(),
  },
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  success: jest.fn(),
  error: jest.fn(),
}))

// Get reference to mock AFTER jest.mock() has run
const { api } = jest.requireMock('@/api/client')

const BOOKS = [
  { id: 'b1', title: 'Book A', author: 'Author A', genre: 'Fiction',     type: 'Fiction',     status: 'read',    rating: '4', is_sikkim: '0', is_base: '1', year: 2000, nation: 'India' },
  { id: 'b2', title: 'Book B', author: 'Author B', genre: 'Non-Fiction', type: 'Non-Fiction', status: 'reading', rating: '',  is_sikkim: '1', is_base: '1', year: 2010, nation: 'Japan' },
  { id: 'b3', title: 'Book C', author: 'Author C', genre: 'Fiction',     type: 'Fiction',     status: '',        rating: '2', is_sikkim: '0', is_base: '0', year: 2020, nation: 'UK'    },
]

beforeEach(() => {
  jest.clearAllMocks()
  api.getBooks.mockResolvedValue({ books: BOOKS })
  api.getWishlist.mockResolvedValue({ items: [] })
  api.setStatus.mockResolvedValue({ book: { id: 'b2', status: 'read', rating: '5' } })
  api.saveReview.mockResolvedValue({ ok: true })
  api.addBook.mockResolvedValue({ book: { id: 'new1', title: 'New Book', author: 'Author' } })
  api.deleteBook.mockResolvedValue({ ok: true })
  api.addWish.mockResolvedValue({ item: { id: 'w1', title: 'Wish Book' } })
  api.deleteWish.mockResolvedValue({ ok: true })
})

function TestConsumer({ selector }) {
  const lib = useLibrary()
  return <div data-testid="output">{JSON.stringify(selector(lib))}</div>
}

function renderWithLibrary(selector) {
  return render(
    <LibraryProvider>
      <TestConsumer selector={selector} />
    </LibraryProvider>
  )
}

describe('LibraryContext', () => {
  it('starts with empty books', () => {
    renderWithLibrary(lib => lib.books.length)
    expect(screen.getByTestId('output').textContent).toBe('0')
  })

  it('starts with library as active view', () => {
    renderWithLibrary(lib => lib.activeView)
    expect(screen.getByTestId('output').textContent).toBe('"library"')
  })

  it('fetchBooks loads books from API', async () => {
    function FetchTest() {
      const { books, fetchBooks } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Fetch</button>
          <div data-testid="count">{books.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><FetchTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Fetch')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
  })

  it('filteredBooks filters by genre', async () => {
    function GenreTest() {
      const { filteredBooks, dispatch, fetchBooks } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Load</button>
          <button onClick={() => dispatch({ type: 'SET_GENRE', payload: 'Fiction' })}>Filter</button>
          <div data-testid="count">{filteredBooks.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><GenreTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Load')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
    act(() => { fireEvent.click(screen.getByText('Filter')) })
    expect(screen.getByTestId('count').textContent).toBe('2')
  })

  it('filteredBooks filters by search query', async () => {
    function SearchTest() {
      const { filteredBooks, dispatch, fetchBooks } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Load</button>
          <button onClick={() => dispatch({ type: 'SET_SEARCH', payload: 'Book A' })}>Search</button>
          <div data-testid="count">{filteredBooks.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><SearchTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Load')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
    act(() => { fireEvent.click(screen.getByText('Search')) })
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('filteredBooks returns empty for no match', async () => {
    function NoMatchTest() {
      const { filteredBooks, dispatch, fetchBooks } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Load</button>
          <button onClick={() => dispatch({ type: 'SET_SEARCH', payload: 'zzznomatch' })}>Search</button>
          <div data-testid="count">{filteredBooks.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><NoMatchTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Load')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
    act(() => { fireEvent.click(screen.getByText('Search')) })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('filteredBooks filters sikkim books', async () => {
    function SikkimTest() {
      const { filteredBooks, dispatch, fetchBooks } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Load</button>
          <button onClick={() => dispatch({ type: 'SET_GENRE', payload: 'sikkim' })}>Sikkim</button>
          <div data-testid="count">{filteredBooks.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><SikkimTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Load')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
    act(() => { fireEvent.click(screen.getByText('Sikkim')) })
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('rateBook calls setStatus API', async () => {
    function RateTest() {
      const { books, fetchBooks, rateBook } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Load</button>
          <button onClick={() => rateBook('b2', 5, 'read')}>Rate</button>
          <div data-testid="count">{books.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><RateTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Load')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
    act(() => { fireEvent.click(screen.getByText('Rate')) })
    await waitFor(() => expect(api.setStatus).toHaveBeenCalledWith('b2', { rating: '5', status: 'read' }))
  })

  it('addBook adds a book and updates count', async () => {
    function AddTest() {
      const { books, fetchBooks, addBook } = useLibrary()
      return (
        <div>
          <button onClick={fetchBooks}>Load</button>
          <button onClick={() => addBook({ title: 'New', author: 'Author' })}>Add</button>
          <div data-testid="count">{books.length}</div>
        </div>
      )
    }
    render(<LibraryProvider><AddTest /></LibraryProvider>)
    act(() => { fireEvent.click(screen.getByText('Load')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('3'))
    act(() => { fireEvent.click(screen.getByText('Add')) })
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('4'))
  })

  it('SET_VIEW changes activeView', () => {
    function ViewTest() {
      const { activeView, dispatch } = useLibrary()
      return (
        <div>
          <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}>Go</button>
          <div data-testid="view">{activeView}</div>
        </div>
      )
    }
    render(<LibraryProvider><ViewTest /></LibraryProvider>)
    fireEvent.click(screen.getByText('Go'))
    expect(screen.getByTestId('view').textContent).toBe('dashboard')
  })

  it('OPEN_DRAWER sets drawer open and tab', () => {
    function DrawerTest() {
      const { drawer, dispatch } = useLibrary()
      return (
        <div>
          <button onClick={() => dispatch({ type: 'OPEN_DRAWER', payload: { bookId: 'b1', tab: 'rating' } })}>Open</button>
          <div data-testid="open">{String(drawer.open)}</div>
          <div data-testid="tab">{drawer.tab}</div>
        </div>
      )
    }
    render(<LibraryProvider><DrawerTest /></LibraryProvider>)
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByTestId('open').textContent).toBe('true')
    expect(screen.getByTestId('tab').textContent).toBe('rating')
  })

  it('throws when useLibrary used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer selector={l => l.books} />)).toThrow()
    spy.mockRestore()
  })
})
