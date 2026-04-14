// tests/unit/SearchBar.test.jsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SearchBar from '../../src/components/SearchBar'

// Mock the LibraryContext
const mockDispatch = jest.fn()
jest.mock('../../src/context/LibraryContext', () => ({
  useLibrary: () => ({ dispatch: mockDispatch })
}))

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockDispatch.mockClear()
  })
  afterEach(() => { jest.useRealTimers() })

  it('renders with placeholder', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText(/search title/i)).toBeInTheDocument()
  })

  it('has correct test id', () => {
    render(<SearchBar />)
    expect(screen.getByTestId('search-input')).toBeInTheDocument()
  })

  it('updates input value as user types', () => {
    render(<SearchBar />)
    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'Murakami' } })
    expect(input.value).toBe('Murakami')
  })

  it('debounces dispatch by 300ms', async () => {
    render(<SearchBar />)
    // Flush initial mount dispatch
    act(() => { jest.advanceTimersByTime(300) })
    mockDispatch.mockClear()

    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'Kaf' } })
    expect(mockDispatch).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(300) })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SEARCH', payload: 'Kaf' })
  })

  it('does not dispatch before debounce delay', () => {
    render(<SearchBar />)
    // Flush initial mount dispatch
    act(() => { jest.advanceTimersByTime(300) })
    mockDispatch.mockClear()

    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'test' } })
    act(() => { jest.advanceTimersByTime(200) })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('shows clear button when input has value', async () => {
    render(<SearchBar />)
    const input = screen.getByTestId('search-input')
    expect(screen.queryByTestId('search-clear')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(screen.getByTestId('search-clear')).toBeInTheDocument()
  })

  it('clears input and dispatches empty string on clear click', async () => {
    render(<SearchBar />)
    act(() => { jest.advanceTimersByTime(300) })
    mockDispatch.mockClear()

    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'hello' } })
    act(() => { jest.advanceTimersByTime(300) })
    mockDispatch.mockClear()

    fireEvent.click(screen.getByTestId('search-clear'))
    expect(input.value).toBe('')
    act(() => { jest.advanceTimersByTime(300) })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SEARCH', payload: '' })
  })

  it('dispatches empty string for empty search', async () => {
    render(<SearchBar />)
    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: '' } })
    act(() => { jest.advanceTimersByTime(300) })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SEARCH', payload: '' })
  })
})
