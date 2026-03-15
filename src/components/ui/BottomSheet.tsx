'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoints?: number[] // percentages of viewport height, e.g. [40, 80]
  initialSnap?: number
  className?: string
  showHandle?: boolean
  showCloseButton?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHandle = true,
  showCloseButton = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle touch swipe to close
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY
    const delta = touchCurrentY.current - touchStartY.current

    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const delta = touchCurrentY.current - touchStartY.current

    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
      sheetRef.current.style.transition = ''
    }

    if (delta > 100) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="bottom-sheet-overlay"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn('bottom-sheet-content', className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-white font-semibold text-base">
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-surface-3 tap-highlight-none"
              >
                <X size={18} className="text-text-secondary" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  )
}

// Compact action sheet variant
interface ActionSheetOption {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  options: ActionSheetOption[]
}

export function ActionSheet({ isOpen, onClose, title, options }: ActionSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={false}
    >
      <div className="px-4 pb-safe-bottom pb-6 space-y-2">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => {
              option.onClick()
              onClose()
            }}
            className={cn(
              'w-full flex items-center gap-4 px-5 py-4 rounded-2xl',
              'text-left font-medium transition-colors tap-highlight-none',
              option.destructive
                ? 'bg-error/10 text-error hover:bg-error/20'
                : 'bg-surface-2 text-white hover:bg-surface-3'
            )}
          >
            {option.icon && (
              <span className={option.destructive ? 'text-error' : 'text-text-secondary'}>
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        ))}

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-surface-3 text-text-secondary font-semibold tap-highlight-none"
        >
          취소
        </button>
      </div>
    </BottomSheet>
  )
}
