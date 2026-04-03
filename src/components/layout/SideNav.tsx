'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { Home, Palette, Map, MessageSquare, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

interface NavItem {
  href: '/feed' | '/artists' | '/map' | '/community' | '/profile'
  icon: LucideIcon
  labelKey: string
  isCenter?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/feed', icon: Home, labelKey: 'feed' },
  { href: '/artists', icon: Palette, labelKey: 'artists' },
  { href: '/map', icon: Map, labelKey: 'map', isCenter: true },
  { href: '/community', icon: MessageSquare, labelKey: 'community' },
  { href: '/profile', icon: User, labelKey: 'profile' },
]

export function SideNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname.startsWith('/feed/')
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-50 w-16 lg:w-56 border-r border-border/50 bg-background/90 backdrop-blur-md">
      {/* Logo */}
      <Link href="/" className="flex items-center px-4 h-16 shrink-0 tap-highlight-none hover:opacity-80 transition-opacity">
        <Logo size="md" />
        <span className="hidden lg:block text-base font-black tracking-wide text-white ml-3">WALLSCAPE</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-2 py-2.5 rounded-2xl tap-highlight-none group mt-1"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-primary transition-transform group-active:scale-90 shrink-0">
                  <Icon size={20} className="text-white" strokeWidth={2} />
                </div>
                <span className="hidden lg:block text-sm font-bold text-white">{t('map')}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-2 py-2.5 rounded-2xl transition-all duration-200 tap-highlight-none group',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:bg-surface-2 hover:text-white'
              )}
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className="transition-colors duration-200"
                />
              </div>
              <span className={cn(
                'hidden lg:block text-sm font-semibold transition-colors duration-200',
                active ? 'text-primary' : ''
              )}>
                {t(item.labelKey)}
              </span>
              {active && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
