// src/components/ui/Button.jsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-bamboo text-white hover:bg-bamboo-dark active:bg-bamboo-deeper disabled:bg-bamboo/40',
  secondary: 'bg-white border border-fog-dark text-ink hover:border-bamboo hover:text-bamboo active:bg-fog',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
  ghost:     'text-stone hover:text-bamboo hover:bg-fog active:bg-fog-dark',
  outline:   'border border-bamboo text-bamboo hover:bg-bamboo hover:text-white active:bg-bamboo-dark',
}
const sizes = {
  xs: 'text-xs px-2.5 py-1.5 gap-1',
  sm: 'text-xs px-3 py-2 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-5 py-3 gap-2',
}

const Button = forwardRef(function Button({
  variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', children, ...props
}, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-sans font-medium rounded-md',
        'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-bamboo/40',
        'disabled:cursor-not-allowed select-none',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
      {children}
    </button>
  )
})

export default Button
