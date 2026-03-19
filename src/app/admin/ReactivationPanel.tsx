'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, UserCheck, Check, X, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────
interface ReactivationRequest {
  id: string
  user_id: string
  email: string
  username: string
  display_name: string | null
  requested_at: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  processed_at: string | null
}

// ── Component ────────────────────────────────────────────────
export default function ReactivationPanel() {
  const [requests, setRequests] = useState<ReactivationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/reactivation-requests')
      if (!res.ok) {
        let msg = `서버 오류 (${res.status})`
        try {
          const body = await res.json()
          msg = body.error || msg
        } catch {}
        throw new Error(msg)
      }
      const data: { requests: ReactivationRequest[] } = await res.json()
      setRequests(data.requests)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (
    id: string,
    action: 'approve' | 'reject',
    admin_note?: string
  ) => {
    setActionLoading(id + '-' + action)
    try {
      const res = await fetch('/api/admin/reactivation-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, admin_note }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || '처리에 실패했습니다.')
      }
      // 처리 완료된 항목은 목록에서 제거
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '처리에 실패했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (id: string) => {
    if (!confirm('이 계정의 재활성화를 승인하시겠습니까?')) return
    handleAction(id, 'approve')
  }

  const handleReject = (id: string) => {
    const note = prompt('거절 사유를 입력하세요 (선택사항):')
    if (note === null) return // 취소
    handleAction(id, 'reject', note || undefined)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">재활성화 요청</h2>
        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-text-secondary hover:text-white text-xs transition-colors disabled:opacity-50 tap-highlight-none"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">새로고침</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-text-secondary text-xs">대기 중인 요청</span>
          <span className="text-2xl font-black text-white">{requests.length}</span>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-2xl px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* Request list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox size={28} className="text-text-muted" />
          </div>
          <p className="text-text-secondary text-base font-medium">대기 중인 요청이 없습니다</p>
          <p className="text-text-muted text-sm mt-1">모든 재활성화 요청이 처리되었습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isApproving = actionLoading === req.id + '-approve'
            const isRejecting = actionLoading === req.id + '-reject'

            return (
              <div
                key={req.id}
                className="bg-surface rounded-2xl border border-white/5 p-4 flex items-center gap-4"
              >
                <Avatar src={null} username={req.username} size="md" className="shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-white font-semibold">
                      {req.display_name || req.username}
                    </span>
                    <span className="text-text-secondary text-sm">@{req.username}</span>
                  </div>
                  <p className="text-text-muted text-xs truncate">{req.email}</p>
                  <p className="text-text-muted text-xs mt-1">
                    요청일: {formatRelativeTime(req.requested_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    isLoading={isApproving}
                    disabled={!!actionLoading}
                    onClick={() => handleApprove(req.id)}
                    leftIcon={<Check size={14} />}
                  >
                    <span className="hidden sm:inline">승인</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={isRejecting}
                    disabled={!!actionLoading}
                    onClick={() => handleReject(req.id)}
                    leftIcon={<X size={14} />}
                  >
                    <span className="hidden sm:inline">거절</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
