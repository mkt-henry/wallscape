'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Check, X, Inbox, Instagram, Globe, Brush } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'

interface ArtistApplication {
  id: string
  user_id: string
  artist_name: string
  bio: string | null
  instagram_handle: string | null
  website: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  processed_at: string | null
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export default function ArtistApplicationsPanel() {
  const [applications, setApplications] = useState<ArtistApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const fetchApplications = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/artist-applications')
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data: { applications: ArtistApplication[] } = await res.json()
      setApplications(data.applications)
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id + action)
    try {
      const res = await fetch('/api/admin/artist-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) throw new Error('처리에 실패했습니다.')
      await fetchApplications()
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = applications.filter((a) => a.status === filter)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-surface-2 rounded-xl p-1">
          {(['pending', 'approved', 'rejected'] as const).map((s) => {
            const count = applications.filter((a) => a.status === s).length
            const label = s === 'pending' ? '대기' : s === 'approved' ? '승인' : '거절'
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-highlight-none flex items-center gap-1.5 ${
                  filter === s ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === s ? 'bg-white/20' : 'bg-surface-3 text-text-muted'
                  }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={fetchApplications}
          disabled={isLoading}
          className="p-2 rounded-xl hover:bg-surface-2 transition-colors tap-highlight-none"
        >
          <RefreshCw size={16} className={`text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-error text-sm text-center">{error}</p>}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-20 flex flex-col items-center gap-3 text-center">
          <Inbox size={32} className="text-text-muted" />
          <p className="text-text-secondary text-sm">
            {filter === 'pending' ? '대기 중인 신청이 없습니다' : filter === 'approved' ? '승인된 신청이 없습니다' : '거절된 신청이 없습니다'}
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.map((app) => (
          <div key={app.id} className="bg-surface rounded-2xl p-5 space-y-4">
            {/* User info */}
            <div className="flex items-start gap-3">
              <Avatar
                src={app.profiles?.avatar_url ?? null}
                username={app.profiles?.username ?? '?'}
                size="md"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold">{app.artist_name}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    app.status === 'approved' ? 'bg-primary/20 text-primary' :
                    'bg-error/20 text-error'
                  }`}>
                    {app.status === 'pending' ? '대기' : app.status === 'approved' ? '승인' : '거절'}
                  </span>
                </div>
                <p className="text-text-secondary text-sm">@{app.profiles?.username}</p>
                <p className="text-text-muted text-xs mt-0.5">{formatRelativeTime(app.created_at)}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2 text-sm">
              {app.bio && (
                <div>
                  <span className="text-text-muted text-xs flex items-center gap-1 mb-0.5"><Brush size={11} /> 소개</span>
                  <p className="text-white/80 leading-relaxed">{app.bio}</p>
                </div>
              )}
              {app.instagram_handle && (
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Instagram size={13} className="shrink-0" />
                  <span>@{app.instagram_handle}</span>
                </div>
              )}
              {app.website && (
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Globe size={13} className="shrink-0" />
                  <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate">
                    {app.website}
                  </a>
                </div>
              )}
              {app.note && (
                <div className="p-3 bg-surface-2 rounded-xl">
                  <p className="text-text-muted text-xs mb-0.5">추가 메시지</p>
                  <p className="text-white/80 text-sm">{app.note}</p>
                </div>
              )}
            </div>

            {/* Actions (pending only) */}
            {app.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => handleAction(app.id, 'approve')}
                  isLoading={actionLoading === app.id + 'approve'}
                  disabled={!!actionLoading}
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  승인
                </Button>
                <Button
                  onClick={() => handleAction(app.id, 'reject')}
                  isLoading={actionLoading === app.id + 'reject'}
                  disabled={!!actionLoading}
                  variant="danger"
                  size="sm"
                  className="flex-1 flex items-center justify-center gap-1.5"
                >
                  <X size={14} />
                  거절
                </Button>
              </div>
            )}

            {app.processed_at && (
              <p className="text-text-muted text-xs">처리: {formatRelativeTime(app.processed_at)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
