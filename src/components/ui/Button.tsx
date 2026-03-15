import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-white font-semibold
    hover:bg-primary-hover active:bg-primary-active
    shadow-glow-primary/20
    disabled:bg-primary/50
  `,
  secondary: `
    bg-surface-2 text-white font-semibold
    border border-border
    hover:bg-surface-3
    disabled:bg-surface-2/50
  `,
  ghost: `
    text-text-secondary font-medium
    hover:bg-surface-2 hover:text-white
    disabled:text-text-muted
  `,
  danger: `
    bg-error text-white font-semibold
    hover:bg-red-600 active:bg-red-700
    disabled:bg-error/50
  `,
  outline: `
    bg-transparent text-primary font-semibold
    border-2 border-primary
    hover:bg-primary/10
    disabled:opacity-50
  `,
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2',
          'transition-all duration-200',
          'tap-highlight-none touch-manipulation',
          'active:scale-95',
          'disabled:cursor-not-allowed disabled:active:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // Variant
          VARIANT_STYLES[variant],
          // Size
          SIZE_STYLES[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} />
            <span>처리 중...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
