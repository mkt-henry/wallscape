'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, UserPlus, MapPin, Bell } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { NotificationWithActor, NotificationType } from '@/types'

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  like_post: <Heart size={14} className="fill-red-500 text-red-500" />,
  like_comment: <Heart size={14} className="fill-red-500 text-red-500" />,
  comment: <MessageCircle size={14} className="text-primary" />,
  reply: <MessageCircle size={14} className="text-secondary" />,
  follow: <UserPlus size={14} className="text-secondary" />,
  mention: <Bell size={14} className="text-warning" />,
  nearby_post: <MapPin size={14} className="text-primary" />,
}

const NOTIFICATION_BG: Record<NotificationType, string> = {
  like_post: 'bg-red-500/20',
  like_comment: 'bg-red-500/20',
  comment: 'bg-primary/20',
  reply: 'bg-secondary/20',
  follow: 'bg-secondary/20',
  mention: 'bg-warning/20',
  nearby_post: 'bg-primary/20',
}

function NotificationItem({ notification }: { notification: NotificationWithActor }) {
  const getNotificationText = (type: NotificationType): string => {
    switch (type) {
      case 'like_post': return '님이 회원님의 게시물을 좋아합니다'
      case 'like_comment': return '님이 회원님의 댓글을 좋아합니다'
      case 'comment': return '님이 회원님의 게시물에 댓글을 남겼습니다'
      case 'reply': return '님이 회원님의 댓글에 답글을 남겼습니다'
      case 'follow': return '님이 회원님을 팔로우하기 시작했습니다'
      case 'mention': return '님이 댓글에서 회원님을 언급했습니다'
      case 'nearby_post': return '근처에 새 게시물이 올라왔습니다'
      default: return '새 알림이 있습니다'
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors',
        !notification.is_read && 'bg-surface/50'
      )}
    >
      {/* Actor avatar with type badge */}
      <div className="relative shrink-0">
        <Avatar
          src={notification.actor.avatar_url}
          username={notification.actor.username}
          size="md"
        />
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center',
            NOTIFICATION_BG[notification.type]
          )}
        >
          {NOTIFICATION_ICONS[notification.type]}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">
          <Link
            href={`/profile/${notification.actor.username}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {notification.actor.display_name || notification.actor.username}
          </Link>
          {getNotificationText(notification.type)}
        </p>

        {notification.message && (
          <p className="text-text-secondary text-xs mt-0.5 line-clamp-1">
            {notification.message}
          </p>
        )}

        <p className="text-text-muted text-xs mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Post thumbnail */}
      {notification.post?.image_url && (
        <Link
          href={`/feed/${notification.post.id}`}
          className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-surface-2 tap-highlight-none"
        >
          <Image
            src={notification.post.image_url}
            alt={notification.post.title}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </Link>
      )}

      {/* Unread dot */}
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-2 w-1/2 rounded" />
      </div>
      <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
    </div>
  )
}

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')
  const { user } = useAuthStore()
  const supabase = getSupabaseClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, activeFilter],
    queryFn: async () => {
      if (!user) return []

      let query = supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(
            id, username, display_name, avatar_url
          ),
          post:posts(id, image_url, title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (activeFilter === 'unread') {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query
      if (error) throw error
      return data as NotificationWithActor[]
    },
    enabled: !!user,
  })

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-white text-xl font-black">알림</h1>
          {unreadCount > 0 && (
            <button className="text-primary text-sm font-semibold tap-highlight-none">
              모두 읽음
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex px-4 pb-3 gap-2">
          {[
            { key: 'all' as const, label: '전체' },
            { key: 'unread' as const, label: `읽지 않음 ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 tap-highlight-none',
                activeFilter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-2 text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {!user && (
          <div className="py-20 flex flex-col items-center gap-4 px-6">
            <Bell size={48} className="text-text-muted" />
            <div className="text-center">
              <p className="text-white font-semibold mb-2">로그인이 필요합니다</p>
              <p className="text-text-secondary text-sm mb-6">
                알림을 받으려면 로그인하세요
              </p>
              <Link
                href="/login"
                className="btn-primary inline-block"
              >
                로그인
              </Link>
            </div>
          </div>
        )}

        {isLoading && user && (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && user && notifications?.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
              <Bell size={28} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">알림이 없어요</p>
              <p className="text-text-secondary text-sm">
                {activeFilter === 'unread'
                  ? '읽지 않은 알림이 없습니다'
                  : '활동이 시작되면 알림이 표시됩니다'}
              </p>
            </div>
          </div>
        )}

        {notifications && notifications.length > 0 && (
          <div className="divide-y divide-border/30">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
