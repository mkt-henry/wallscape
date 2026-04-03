'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, Mail, Calendar, Image as ImageIcon, Users, UserCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'

interface RealUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  email: string | null
  post_count: number
  follower_count: number
  following_count: number
  created_at: string
  last_sign_in_at: string | null
}

export default function UsersPanel() {
  const [users, setUsers] = useState<RealUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `서버 오류 (${res.status})`)
      }
      const data = await res.json()
      setUsers(data.users)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const totalPosts = users.reduce((sum, u) => sum + (u.post_count || 0), 0)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">실제 가입자</h2>
        <button
          onClick={fetchUsers}
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
          <span className="text-text-secondary text-xs">총 가입자</span>
          <span className="text-2xl font-black text-white">{users.length}</span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-text-secondary text-xs">총 게시물</span>
          <span className="text-2xl font-black text-white">{totalPosts}</span>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-2xl px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* User list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Users size={28} className="text-text-muted" />
          </div>
          <p className="text-text-secondary text-base font-medium">가입자가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-surface rounded-2xl border border-white/5 p-4">
              <div className="flex items-start gap-3">
                <Avatar src={user.avatar_url} username={user.username} size="md" className="shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">
                      {user.display_name || user.username}
                    </span>
                    <span className="text-text-secondary text-sm">@{user.username}</span>
                    <a
                      href={`/profile/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-primary transition-colors tap-highlight-none"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>

                  {user.email && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail size={12} className="text-text-muted shrink-0" />
                      <span className="text-text-secondary text-xs">{user.email}</span>
                    </div>
                  )}

                  {user.bio && (
                    <p className="text-text-muted text-xs mt-1 line-clamp-1">{user.bio}</p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-text-muted text-xs">
                      <ImageIcon size={11} />
                      게시물 {user.post_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-text-muted text-xs">
                      <UserCheck size={11} />
                      팔로워 {user.follower_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-text-muted text-xs">
                      <Calendar size={11} />
                      가입 {formatRelativeTime(user.created_at)}
                    </span>
                    {user.last_sign_in_at && (
                      <span className="text-text-muted text-xs">
                        최근 로그인 {formatRelativeTime(user.last_sign_in_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
