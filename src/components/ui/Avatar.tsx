import Image from 'next/image'
import { cn } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface AvatarProps {
  src: string | null | undefined
  username: string
  size?: AvatarSize
  className?: string
  showBorder?: boolean
  borderColor?: string
  onClick?: () => void
}

const SIZE_CONFIG: Record<AvatarSize, { px: number; text: string; className: string }> = {
  xs: { px: 24, text: 'text-[10px]', className: 'w-6 h-6' },
  sm: { px: 32, text: 'text-xs', className: 'w-8 h-8' },
  md: { px: 40, text: 'text-sm', className: 'w-10 h-10' },
  lg: { px: 56, text: 'text-base', className: 'w-14 h-14' },
  xl: { px: 80, text: 'text-xl', className: 'w-20 h-20' },
  '2xl': { px: 112, text: 'text-3xl', className: 'w-28 h-28' },
}

// Generate a consistent color from username
function getAvatarColor(username: string): string {
  const colors = [
    '#FF6B35', // primary
    '#4ECDC4', // secondary
    '#A855F7', // purple
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#EC4899', // pink
  ]
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(username: string): string {
  if (!username) return '?'
  return username.charAt(0).toUpperCase()
}

export function Avatar({
  src,
  username,
  size = 'md',
  className,
  showBorder = false,
  borderColor,
  onClick,
}: AvatarProps) {
  const config = SIZE_CONFIG[size]
  const bgColor = getAvatarColor(username || 'user')
  const initials = getInitials(username || 'user')

  const borderStyle = showBorder
    ? `ring-2 ${borderColor ? '' : 'ring-primary'}`
    : ''

  const containerClass = cn(
    config.className,
    'rounded-full overflow-hidden flex-shrink-0 relative',
    showBorder && 'ring-2',
    showBorder && !borderColor && 'ring-primary',
    onClick && 'cursor-pointer active:scale-95 transition-transform',
    className
  )

  if (src) {
    return (
      <div
        className={containerClass}
        style={borderColor && showBorder ? { boxShadow: `0 0 0 2px ${borderColor}` } : undefined}
        onClick={onClick}
      >
        <Image
          src={src}
          alt={username || 'Avatar'}
          width={config.px}
          height={config.px}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(containerClass, 'flex items-center justify-center')}
      style={{
        backgroundColor: bgColor,
        ...(borderColor && showBorder ? { boxShadow: `0 0 0 2px ${borderColor}` } : {}),
      }}
      onClick={onClick}
    >
      <span className={cn('font-bold text-white', config.text)}>
        {initials}
      </span>
    </div>
  )
}

// Avatar group for showing multiple users
interface AvatarGroupProps {
  users: Array<{ avatar_url: string | null; username: string }>
  max?: number
  size?: AvatarSize
}

export function AvatarGroup({ users, max = 3, size = 'xs' }: AvatarGroupProps) {
  const shown = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className="flex items-center">
      {shown.map((user, i) => (
        <div
          key={user.username}
          className="relative"
          style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: shown.length - i }}
        >
          <Avatar
            src={user.avatar_url}
            username={user.username}
            size={size}
            showBorder
            borderColor="#0A0A0A"
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            SIZE_CONFIG[size].className,
            'rounded-full bg-surface-2 border-2 border-background',
            'flex items-center justify-center',
            '-ml-2'
          )}
        >
          <span className={cn('text-text-secondary font-medium', SIZE_CONFIG[size].text)}>
            +{overflow}
          </span>
        </div>
      )}
    </div>
  )
}
