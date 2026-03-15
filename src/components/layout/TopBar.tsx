'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  transparent?: boolean
  className?: string
}

export function TopBar({
  title,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  transparent = false,
  className,
}: TopBarProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex items-center justify-between px-4 h-14',
        !transparent && 'bg-background/90 backdrop-blur-md border-b border-border/20',
        'pt-safe-top',
        className
      )}
    >
      {/* Left */}
      <div className="w-10 flex items-center">
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 tap-highlight-none"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
        ) : (
          leftAction
        )}
      </div>

      {/* Center title */}
      {title && (
        <h1 className="text-white font-semibold text-base flex-1 text-center">
          {title}
        </h1>
      )}

      {/* Right action */}
      <div className="w-10 flex items-center justify-end">
        {rightAction}
      </div>
    </div>
  )
}
