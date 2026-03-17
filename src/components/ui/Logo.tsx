import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LogoProps {
  size?: LogoSize
  className?: string
  showText?: boolean
}

const SIZE_MAP: Record<LogoSize, { px: number; className: string; textClass: string }> = {
  xs: { px: 24, className: 'w-6 h-6', textClass: 'text-sm' },
  sm: { px: 28, className: 'w-7 h-7', textClass: 'text-sm' },
  md: { px: 32, className: 'w-8 h-8', textClass: 'text-lg' },
  lg: { px: 48, className: 'w-12 h-12', textClass: 'text-2xl' },
  xl: { px: 64, className: 'w-16 h-16', textClass: 'text-3xl' },
}

export function Logo({ size = 'md', className, showText = false }: LogoProps) {
  const config = SIZE_MAP[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(config.className, 'rounded-xl overflow-hidden shrink-0')}>
        <Image
          src="/logo.png"
          alt="Wallscape"
          width={config.px}
          height={config.px}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      {showText && (
        <span className={cn('font-black tracking-wide text-white', config.textClass)}>
          WALLSCAPE
        </span>
      )}
    </div>
  )
}
