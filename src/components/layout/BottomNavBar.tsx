'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, PlusSquare, Bell, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  isUpload?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/feed', icon: Home, label: '피드' },
  { href: '/map', icon: Map, label: '지도' },
  { href: '/upload', icon: PlusSquare, label: '올리기', isUpload: true },
  { href: '/activity', icon: Bell, label: '알림' },
  { href: '/profile', icon: User, label: '프로필' },
]

export function BottomNavBar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname.startsWith('/feed/')
    return pathname.startsWith(href)
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-md border-t border-border/50" />

      <nav
        className="relative flex items-center justify-around px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          if (item.isUpload) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex justify-center py-3 tap-highlight-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-primary transition-transform active:scale-90">
                  <Icon size={24} className="text-white" strokeWidth={2} />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 tap-highlight-none group"
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={cn(
                    'transition-all duration-200',
                    active
                      ? 'text-primary'
                      : 'text-text-muted group-active:text-text-secondary'
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  active ? 'text-primary' : 'text-text-muted'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
