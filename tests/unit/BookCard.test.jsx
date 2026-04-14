// tests/unit/BookCard.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookCard from '../../src/components/BookCard'

const mockDispatch = jest.fn()
const mockSetStatus = jest.fn().mockResolvedValue(undefined)

jest.mock('../../src/context/LibraryContext', () => ({
  useLibrary: () => ({
    dispatch: mockDispatch,
    setStatus: mockSetStatus,
  })
}))

const BOOK = {
  id: 'test_1',
  title: 'Norwegian Wood',
  author: 'Haruki Murakami',
  genre: 'Fiction',
  type: 'Fiction',
  year: 1987,
  nation: '🇯🇵 Japan',
  description: 'A melancholy story of youth.',
  is_base: 1,
  is_sikkim: 0,
  rating: null,
  status: null,
}

describe('BookCard', () => {
  it('renders book title', () => {
    render(<BookCard book={BOOK} />)
    expect(screen.getByText('Norwegian Wood')).toBeInTheDocument()
  })

  it('renders book author', () => {
    render(<BookCard book={BOOK} />)
    expect(screen.getByText('Haruki Murakami')).toBeInTheDocument()
  })

  it('renders genre chip', () => {
    render(<BookCard book={BOOK} />)
    expect(screen.getAllByText('Fiction').length).toBeGreaterThan(0)
  })

  it('renders nation and year in footer', () => {
    render(<BookCard book={BOOK} />)
    expect(screen.getByText('🇯🇵 Japan')).toBeInTheDocument()
    expect(screen.getByText('1987')).toBeInTheDocument()
  })

  it('has correct data-testid', () => {
    render(<BookCard book={BOOK} />)
    expect(screen.getByTestId('book-card')).toBeInTheDocument()
  })

  it('opens drawer on card click', () => {
    render(<BookCard book={BOOK} />)
    fireEvent.click(screen.getByTestId('book-card'))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'OPEN_DRAWER',
      payload: { bookId: 'test_1', tab: 'about' }
    })
  })

  it('shows rating badge when book is rated', () => {
    render(<BookCard book={{ ...BOOK, rating: 4 }} />)
    expect(screen.getByText('🔥')).toBeInTheDocument()
    expect(screen.getByText('Brilliant')).toBeInTheDocument()
  })

  it('shows status pill when book has status', () => {
    render(<BookCard book={{ ...BOOK, status: 'read' }} />)
    expect(screen.getByText('Read')).toBeInTheDocument()
  })

  it('shows reading status pill', () => {
    render(<BookCard book={{ ...BOOK, status: 'reading' }} />)
    expect(screen.getByText('Reading')).toBeInTheDocument()
  })

  it('shows Sikkim badge for sikkim books', () => {
    render(<BookCard book={{ ...BOOK, is_sikkim: 1 }} />)
    expect(screen.getByTitle('Sikkim Collection')).toBeInTheDocument()
  })

  it('renders in list view mode', () => {
    render(<BookCard book={BOOK} listView />)
    expect(screen.getByTestId('book-card')).toBeInTheDocument()
    expect(screen.getByText('Norwegian Wood')).toBeInTheDocument()
  })

  it('calls setStatus with correct status', async () => {
    render(<BookCard book={BOOK} />)
    // Hover to show actions — simulate hover
    const card = screen.getByTestId('book-card')
    fireEvent.mouseEnter(card)
    const readBtn = screen.queryByTestId('status-btn-read')
    if (readBtn) {
      fireEvent.click(readBtn)
      await waitFor(() => expect(mockSetStatus).toHaveBeenCalledWith('test_1', 'read'))
    }
  })

  it('renders description text', () => {
    render(<BookCard book={BOOK} />)
    expect(screen.getByText('A melancholy story of youth.')).toBeInTheDocument()
  })

  it('handles missing year gracefully', () => {
    render(<BookCard book={{ ...BOOK, year: null }} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('handles BCE years correctly', () => {
    render(<BookCard book={{ ...BOOK, year: -400 }} />)
    expect(screen.getByText('400 BCE')).toBeInTheDocument()
  })
})
