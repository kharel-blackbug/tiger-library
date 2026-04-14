// src/components/ui/Input.jsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'

export const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium tracking-widest uppercase text-stone">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 text-sm font-sans bg-white border rounded-md text-ink placeholder-stone/50',
          'focus:outline-none focus:ring-2 focus:ring-bamboo/30 focus:border-bamboo transition-colors',
          error ? 'border-red-400 focus:ring-red-200' : 'border-fog-dark',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
      {hint && !error && <span className="text-xs text-stone">{hint}</span>}
    </div>
  )
})

export const Select = forwardRef(function Select({ label, error, children, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium tracking-widest uppercase text-stone">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 text-sm font-sans bg-white border rounded-md text-ink cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-bamboo/30 focus:border-bamboo transition-colors',
          error ? 'border-red-400' : 'border-fog-dark',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium tracking-widest uppercase text-stone">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-3 py-2.5 text-sm font-serif bg-white border rounded-md text-ink placeholder-stone/50',
          'focus:outline-none focus:ring-2 focus:ring-bamboo/30 focus:border-bamboo transition-colors resize-y',
          error ? 'border-red-400' : 'border-fog-dark',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
})
