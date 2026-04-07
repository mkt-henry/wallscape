'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
  Users,
  UserCheck,
  Brush,
  Newspaper,
} from 'lucide-react'
import FeedbackPanel from './FeedbackPanel'
import AccountsPanel from './AccountsPanel'
import UsersPanel from './UsersPanel'
import ReactivationPanel from './ReactivationPanel'
import ArtistApplicationsPanel from './ArtistApplicationsPanel'
import NewsPanel from './NewsPanel'
import { Logo } from '@/components/ui/Logo'

type AdminTab = 'feedback' | 'accounts' | 'users' | 'reactivation' | 'artists' | 'news'

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('feedback')
  const t = useTranslations('admin')

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── Top bar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Row: branding + tabs */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors tap-highlight-none shrink-0"
              >
                <ArrowLeft size={16} />
                <span className="text-sm hidden sm:inline">{t('home')}</span>
              </Link>
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <Logo size="sm" />
                <span className="text-sm font-bold truncate">{t('title')}</span>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-surface-2 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setTab('feedback')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none ${
                  tab === 'feedback'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <MessageSquare size={13} />
                <span className="hidden xs:inline">{t('feedbackTab')}</span>
              </button>
              <button
                onClick={() => setTab('accounts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none ${
                  tab === 'accounts'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <UserPlus size={13} />
                <span className="hidden xs:inline">{t('accountsTab')}</span>
              </button>
              <button
                onClick={() => setTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none ${
                  tab === 'users'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Users size={13} />
                <span className="hidden xs:inline">{t('usersTab')}</span>
              </button>
              <button
                onClick={() => setTab('reactivation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none ${
                  tab === 'reactivation'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <UserCheck size={13} />
                <span className="hidden xs:inline">{t('reactivationTab')}</span>
              </button>
              <button
                onClick={() => setTab('artists')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none ${
                  tab === 'artists'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Brush size={13} />
                <span className="hidden xs:inline">{t('artistAppsTab')}</span>
              </button>
              <button
                onClick={() => setTab('news')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none ${
                  tab === 'news'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Newspaper size={13} />
                <span className="hidden xs:inline">{t('newsTab')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {tab === 'feedback' && <FeedbackPanel />}
      {tab === 'accounts' && <AccountsPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'reactivation' && <ReactivationPanel />}
      {tab === 'artists' && <ArtistApplicationsPanel />}
      {tab === 'news' && <NewsPanel />}
    </div>
  )
}
