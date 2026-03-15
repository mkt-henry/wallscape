import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

    return (
      <div className={cn('w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div
          className={cn(
            'flex items-center gap-3',
            'bg-surface-2 rounded-2xl px-4 py-3',
            'border transition-all duration-200',
            error
              ? 'border-error focus-within:ring-1 focus-within:ring-error/30'
              : 'border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30'
          )}
        >
          {/* Left icon */}
          {leftIcon && (
            <span className="text-text-secondary shrink-0">{leftIcon}</span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 bg-transparent text-white text-sm',
              'placeholder:text-text-muted',
              'outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span className="text-text-secondary shrink-0">{rightIcon}</span>
          )}
        </div>

        {/* Error or hint */}
        {error && (
          <p className="mt-1.5 text-error text-xs pl-1">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-text-muted text-xs pl-1">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
