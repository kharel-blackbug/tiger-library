// tests/unit/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../src/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick} disabled>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows loading spinner and disables when loading=true', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    // Spinner is rendered (Loader2 icon)
    expect(btn.querySelector('svg')).toBeInTheDocument()
  })

  it('does not call onClick when loading', () => {
    const onClick = jest.fn()
    render(<Button loading onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/bg-bamboo/)
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Delete</Button>)
    expect(screen.getByRole('button').className).toMatch(/bg-red/)
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Cancel</Button>)
    expect(screen.getByRole('button').className).toMatch(/bg-white/)
  })

  it('applies size classes', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toMatch(/px-3/)
  })

  it('merges custom className', () => {
    render(<Button className="custom-class">Test</Button>)
    expect(screen.getByRole('button').className).toMatch(/custom-class/)
  })
})
