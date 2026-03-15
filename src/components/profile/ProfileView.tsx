'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Grid3X3, Archive, MapPin, Share2, MoreHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { PostGrid, PostGridSkeleton } from '@/components/feed/PostGrid'
import { formatNumber, cn } from '@/lib/utils'
import { useArchivedPosts, useArchivePost } from '@/hooks/usePosts'
import type { Profile, PostWithUser } from '@/types'

interface ProfileViewProps {
  username: string
  isOwnProfile: boolean
}

type ProfileTab = 'posts' | 'archived'

export function ProfileView({ username, isOwnProfile }: ProfileViewProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = getSupabaseClient()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error

      // Check if following
      if (user && data) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', data.id)
          .single()

        setIsFollowing(!!follow)
      }

      return data as Profile
    },
  })

  // Fetch user posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', profile?.id],
    queryFn: async () => {
      if (!profile) return []

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(id, username, display_name, avatar_url),
          likes(user_id),
          bookmarks(user_id)
        `)
        .eq('user_id', profile.id)
        .eq('status', 'public')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((p) => ({
        ...p,
        is_liked: user
          ? (p.likes as { user_id: string }[])?.some((l) => l.user_id === user.id)
          : false,
        is_bookmarked: user
          ? (p.bookmarks as { user_id: string }[])?.some((b) => b.user_id === user.id)
          : false,
      })) as PostWithUser[]
    },
    enabled: !!profile,
  })

  // Archived posts (own profile only)
  const { data: archivedPosts, isLoading: archivedLoading } = useArchivedPosts(
    isOwnProfile && profile ? profile.id : ''
  )
  const { mutate: archivePost } = useArchivePost()

  const handleUnarchive = (postId: string) => {
    archivePost({ postId, isArchived: true })
  }

  const handleFollowToggle = async () => {
    if (!user || !profile) return

    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
        setIsFollowing(false)
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profile.id,
        })
        setIsFollowing(true)
      }
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${profile?.display_name || profile?.username} - Wallscape`,
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-start gap-4">
            <div className="skeleton w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
              <div className="flex gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-8 w-12 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <PostGridSkeleton count={9} />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">프로필을 찾을 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="text-primary tap-highlight-none"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          {!isOwnProfile ? (
            <button onClick={() => router.back()} className="p-2 -ml-2 tap-highlight-none">
              <ArrowLeft size={24} className="text-white" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          <h1 className="text-white font-semibold">
            @{profile.username}
          </h1>

          <div className="flex items-center gap-1">
            <button onClick={handleShare} className="p-2 tap-highlight-none">
              <Share2 size={20} className="text-white" />
            </button>
            {isOwnProfile && (
              <Link href="/profile/settings" className="p-2 tap-highlight-none">
                <Settings size={20} className="text-white" />
              </Link>
            )}
            {!isOwnProfile && (
              <button className="p-2 tap-highlight-none">
                <MoreHorizontal size={20} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pb-6 pt-4">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <Avatar
            src={profile.avatar_url}
            username={profile.username}
            size="xl"
          />

          {/* Stats */}
          <div className="flex-1 pt-2">
            <div className="flex justify-around">
              <StatItem value={profile.post_count} label="게시물" />
              <StatItem value={profile.follower_count} label="팔로워" />
              <StatItem value={profile.following_count} label="팔로잉" />
            </div>
          </div>
        </div>

        {/* Name & bio */}
        <div className="mt-4">
          <h2 className="text-white font-bold">
            {profile.display_name || profile.username}
          </h2>
          {profile.bio && (
            <p className="text-text-secondary text-sm mt-1 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}
          {profile.location && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin size={13} className="text-text-muted" />
              <span className="text-text-muted text-xs">{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs mt-1 block"
            >
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4">
          {isOwnProfile ? (
            <Link href="/profile/edit">
              <Button fullWidth variant="secondary" size="md">
                프로필 편집
              </Button>
            </Link>
          ) : (
            <div className="flex gap-3">
              <Button
                fullWidth
                variant={isFollowing ? 'secondary' : 'primary'}
                size="md"
                onClick={handleFollowToggle}
                isLoading={isFollowLoading}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </Button>
              <Button variant="secondary" size="md" className="px-5">
                메시지
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold transition-colors',
            activeTab === 'posts'
              ? 'text-white border-b-2 border-white'
              : 'text-text-secondary hover:text-white'
          )}
        >
          <Grid3X3 size={16} />
          게시물
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('archived')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 h-12 text-sm font-semibold transition-colors',
              activeTab === 'archived'
                ? 'text-white border-b-2 border-white'
                : 'text-text-secondary hover:text-white'
            )}
          >
            <Archive size={16} />
            보관함
            {archivedPosts && archivedPosts.length > 0 && (
              <span className="text-xs bg-surface-2 text-text-secondary rounded-full px-1.5 py-0.5">
                {archivedPosts.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Posts grid */}
      {activeTab === 'posts' && (
        <div>
          {postsLoading ? (
            <PostGridSkeleton count={9} />
          ) : posts && posts.length > 0 ? (
            <PostGrid posts={posts} />
          ) : (
            <div className="py-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
                <span className="text-3xl">🎨</span>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">게시물이 없어요</p>
                {isOwnProfile && (
                  <Link href="/upload" className="text-primary text-sm tap-highlight-none">
                    첫 작품을 올려보세요
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Archived grid */}
      {activeTab === 'archived' && isOwnProfile && (
        <div>
          {/* 30-day notice */}
          <div className="mx-4 mt-4 mb-2 flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
            <Archive size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs leading-relaxed">
              보관된 게시물은 보관 후 <span className="font-semibold">30일이 지나면 자동으로 삭제</span>됩니다.
              30일 이내에는 언제든 공개로 전환할 수 있어요.
            </p>
          </div>

          {archivedLoading ? (
            <div className="px-4"><PostGridSkeleton count={6} columns={3} /></div>
          ) : archivedPosts && archivedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 mt-2">
              {archivedPosts.map((post) => (
                <ArchivedGridItem
                  key={post.id}
                  post={post}
                  onUnarchive={() => handleUnarchive(post.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
                <Archive size={28} className="text-text-muted" />
              </div>
              <p className="text-text-secondary text-sm">보관된 게시물이 없어요</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ArchivedGridItem({
  post,
  onUnarchive,
}: {
  post: PostWithUser
  onUnarchive: () => void
}) {
  const archivedAt = post.archived_at ? new Date(post.archived_at) : null
  const now = new Date()
  const daysArchived = archivedAt
    ? Math.floor((now.getTime() - archivedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const daysLeft = Math.max(0, 30 - daysArchived)
  const isExpiringSoon = daysLeft <= 7

  return (
    <div className="relative bg-surface-2 overflow-hidden aspect-square">
      <Image
        src={post.image_url}
        alt={post.title}
        fill
        className="object-cover opacity-40"
        sizes="33vw"
      />
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full border',
            isExpiringSoon
              ? 'bg-red-500/30 border-red-500/50 text-red-300'
              : 'bg-black/50 border-white/20 text-white'
          )}
        >
          {daysLeft === 0 ? '오늘 삭제' : `D-${daysLeft}`}
        </span>
        <button
          onClick={onUnarchive}
          className="text-xs bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-full px-3 py-1 transition-colors tap-highlight-none font-medium"
        >
          공개로 전환
        </button>
      </div>
    </div>
  )
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-white font-bold text-lg leading-tight">
        {formatNumber(value)}
      </span>
      <span className="text-text-secondary text-xs">{label}</span>
    </div>
  )
}
