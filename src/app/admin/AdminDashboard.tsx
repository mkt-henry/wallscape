'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
} from 'lucide-react'
import FeedbackPanel from './FeedbackPanel'
import AccountsPanel from './AccountsPanel'
import { Logo } from '@/components/ui/Logo'

type AdminTab = 'feedback' | 'accounts'

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('feedback')

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
                <span className="text-sm hidden sm:inline">홈</span>
              </Link>
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <Logo size="sm" />
                <span className="text-sm font-bold truncate">관리자</span>
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
                <span className="hidden xs:inline">피드백</span>
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
                <span className="hidden xs:inline">가계정</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {tab === 'feedback' ? <FeedbackPanel /> : <AccountsPanel />}
    </div>
  )
}
