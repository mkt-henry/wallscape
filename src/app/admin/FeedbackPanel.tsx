'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  Bug,
  HelpCircle,
  Handshake,
  Mail,
  MailOpen,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

// ── Types ────────────────────────────────────────────────────
type FeedbackType = 'feedback' | 'bug' | 'contact' | 'partnership'

interface FeedbackItem {
  id: string
  name: string
  email: string
  type: FeedbackType
  message: string
  is_read: boolean
  created_at: string
}

interface StatsData {
  total: number
  unread: number
  byType: Record<FeedbackType, number>
}

type FilterKey = 'all' | FeedbackType | 'unread'

// ── Constants ────────────────────────────────────────────────
const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'feedback', label: '피드백' },
  { key: 'bug', label: '버그 신고' },
  { key: 'contact', label: '문의' },
  { key: 'partnership', label: '파트너십' },
  { key: 'unread', label: '읽지 않음' },
]

const TYPE_META: Record<
  FeedbackType,
  { label: string; color: string; bgColor: string; Icon: React.ElementType }
> = {
  feedback: {
    label: '피드백',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20 border-fuchsia-500/30',
    Icon: MessageSquare,
  },
  bug: {
    label: '버그 신고',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    Icon: Bug,
  },
  contact: {
    label: '문의',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    Icon: HelpCircle,
  },
  partnership: {
    label: '파트너십',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    Icon: Handshake,
  },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FeedbackPanel() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    unread: 0,
    byType: { feedback: 0, bug: 0, contact: 0, partnership: 0 },
  })
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/feedback?page=1')
      if (!res.ok) {
        let msg = `서버 오류 (${res.status})`
        try { const body = await res.json(); msg = body.error || msg } catch {}
        throw new Error(msg)
      }
      const text = await res.text()
      let data: { items: FeedbackItem[]; total: number }
      try { data = JSON.parse(text) } catch { throw new Error('서버 응답을 파싱할 수 없습니다. 잠시 후 다시 시도해주세요.') }
      const allItems: FeedbackItem[] = data.items

      const byType = { feedback: 0, bug: 0, contact: 0, partnership: 0 } as Record<
        FeedbackType,
        number
      >
      let unread = 0
      for (const item of allItems) {
        byType[item.type] = (byType[item.type] ?? 0) + 1
        if (!item.is_read) unread++
      }
      setStats({ total: data.total, unread, byType })
      setItems(allItems)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function markAsRead(id: string) {
    setActionLoading(id + '-read')
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('업데이트 실패')
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      )
      setStats((s) => ({ ...s, unread: Math.max(0, s.unread - 1) }))
    } catch {
      alert('읽음 처리에 실패했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    setActionLoading(id + '-delete')
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('삭제 실패')
      const deleted = items.find((i) => i.id === id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      setStats((s) => ({
        ...s,
        total: s.total - 1,
        unread: deleted && !deleted.is_read ? Math.max(0, s.unread - 1) : s.unread,
        byType: deleted
          ? { ...s.byType, [deleted.type]: Math.max(0, s.byType[deleted.type] - 1) }
          : s.byType,
      }))
      if (expandedId === id) setExpandedId(null)
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !item.is_read
    return item.type === filter
  })

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* ── Stats cards ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">피드백 관리</h2>
        <button
          onClick={fetchAll}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-text-secondary hover:text-white text-xs transition-colors disabled:opacity-50 tap-highlight-none"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="col-span-1 bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-text-secondary text-xs">전체</span>
          <span className="text-2xl font-black text-white">{stats.total}</span>
        </div>
        <div className="col-span-1 bg-surface rounded-2xl p-4 border border-primary/20 flex flex-col gap-1">
          <span className="text-text-secondary text-xs">읽지 않음</span>
          <span className="text-2xl font-black text-primary">{stats.unread}</span>
        </div>
        {(Object.entries(TYPE_META) as [FeedbackType, (typeof TYPE_META)[FeedbackType]][]).map(
          ([type, meta]) => (
            <div
              key={type}
              className="col-span-1 bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-1"
            >
              <span className={`text-xs ${meta.color}`}>{meta.label}</span>
              <span className="text-2xl font-black text-white">{stats.byType[type]}</span>
            </div>
          )
        )}
      </div>

      {/* ── Filter tabs ──────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {FILTER_TABS.map(({ key, label }) => {
          const isActive = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 tap-highlight-none active:scale-95 ${
                isActive
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'bg-surface-2 text-text-secondary border border-border hover:text-white hover:border-white/20'
              }`}
            >
              {label}
              {key === 'unread' && stats.unread > 0 && (
                <span className="ml-1.5 bg-primary/30 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {stats.unread}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Content ──────────────────────────────────── */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-2xl px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox size={28} className="text-text-muted" />
          </div>
          <p className="text-text-secondary text-base font-medium">항목이 없습니다</p>
          <p className="text-text-muted text-sm mt-1">
            {filter === 'unread' ? '모든 메시지를 읽었습니다.' : '이 유형의 메시지가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const meta = TYPE_META[item.type]
            const isExpanded = expandedId === item.id
            const isReadLoading = actionLoading === item.id + '-read'
            const isDeleteLoading = actionLoading === item.id + '-delete'

            return (
              <div
                key={item.id}
                className={`bg-surface rounded-2xl border transition-all duration-200 overflow-hidden ${
                  item.is_read ? 'border-white/5' : 'border-primary/20'
                }`}
              >
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="shrink-0 pt-0.5">
                    {item.is_read ? (
                      <MailOpen size={16} className="text-text-muted" />
                    ) : (
                      <Mail size={16} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.bgColor} ${meta.color}`}
                      >
                        <meta.Icon size={11} />
                        {meta.label}
                      </span>
                      <span className="text-white text-sm font-semibold">{item.name}</span>
                      <a
                        href={`mailto:${item.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-text-muted text-xs hover:text-primary transition-colors break-all"
                      >
                        {item.email}
                      </a>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <p className="text-text-muted text-xs mt-1.5">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-text-muted">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/5">
                    <div className="bg-surface-2 rounded-xl p-4 mt-4">
                      <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
                        전체 메시지
                      </p>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-surface-2 rounded-xl p-3">
                        <span className="text-text-muted block mb-1">제출자</span>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3">
                        <span className="text-text-muted block mb-1">이메일</span>
                        <a
                          href={`mailto:${item.email}`}
                          className="text-primary font-medium hover:underline break-all"
                        >
                          {item.email}
                        </a>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3">
                        <span className="text-text-muted block mb-1">제출 일시</span>
                        <span className="text-white font-medium">{formatDate(item.created_at)}</span>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3">
                        <span className="text-text-muted block mb-1">읽음 여부</span>
                        <span
                          className={`font-medium ${item.is_read ? 'text-green-400' : 'text-primary'}`}
                        >
                          {item.is_read ? '읽음' : '읽지 않음'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!item.is_read && (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={isReadLoading}
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(item.id)
                          }}
                          leftIcon={<MailOpen size={14} />}
                        >
                          읽음으로 표시
                        </Button>
                      )}
                      <a href={`mailto:${item.email}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" leftIcon={<Mail size={14} />}>
                          답장 보내기
                        </Button>
                      </a>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={isDeleteLoading}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteItem(item.id)
                        }}
                        leftIcon={<Trash2 size={14} />}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
