'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Grid3X3, MapPin, Share2, MoreHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { PostGrid, PostGridSkeleton } from '@/components/feed/PostGrid'
import { formatNumber } from '@/lib/utils'
import type { Profile, PostWithUser } from '@/types'

interface ProfileViewProps {
  username: string
  isOwnProfile: boolean
}

export function ProfileView({ username, isOwnProfile }: ProfileViewProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = getSupabaseClient()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

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
          profiles!posts_user_id_fkey(id, username, display_name, avatar_url),
          likes(user_id),
          bookmarks(user_id)
        `)
        .eq('user_id', profile.id)
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

      {/* Posts grid header */}
      <div className="flex items-center justify-center h-12 border-b border-border">
        <div className="flex items-center gap-2 text-white">
          <Grid3X3 size={18} />
          <span className="text-sm font-semibold">게시물</span>
        </div>
      </div>

      {/* Posts grid */}
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
