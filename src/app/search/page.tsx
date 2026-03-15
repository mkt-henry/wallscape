'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, X, Hash, MapPin, User as UserIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { PostGrid } from '@/components/feed/PostGrid'
import { debounce, cn } from '@/lib/utils'
import type { PostWithUser, Profile, TagResult, SearchType } from '@/types'
import Link from 'next/link'

const SEARCH_TABS: { key: SearchType; label: string; icon: React.ReactNode }[] = [
  { key: 'posts', label: '게시물', icon: <Hash size={16} /> },
  { key: 'users', label: '사용자', icon: <UserIcon size={16} /> },
  { key: 'tags', label: '태그', icon: <Hash size={16} /> },
  { key: 'locations', label: '위치', icon: <MapPin size={16} /> },
]

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get('q') || ''
  const initialType = (searchParams.get('type') as SearchType) || 'posts'

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<SearchType>(initialType)

  const supabase = getSupabaseClient()

  const debouncedSetQuery = useCallback(
    debounce((value: unknown) => setDebouncedQuery(value as string), 400),
    []
  )

  const handleQueryChange = (value: string) => {
    setQuery(value)
    debouncedSetQuery(value)
  }

  // Search posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['search', 'posts', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return []
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(id, username, display_name, avatar_url),
          is_liked:likes(user_id),
          is_bookmarked:bookmarks(user_id)
        `)
        .or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(30)
      return (data || []) as PostWithUser[]
    },
    enabled: !!debouncedQuery && activeTab === 'posts',
  })

  // Search users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['search', 'users', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return []
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${debouncedQuery}%,display_name.ilike.%${debouncedQuery}%`)
        .limit(20)
      return (data || []) as Profile[]
    },
    enabled: !!debouncedQuery && activeTab === 'users',
  })

  // Search tags
  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['search', 'tags', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return []
      const { data } = await supabase.rpc('search_tags', {
        search_term: debouncedQuery.replace('#', ''),
      })
      return (data || []) as TagResult[]
    },
    enabled: !!debouncedQuery && activeTab === 'tags',
  })

  const isLoading =
    (activeTab === 'posts' && postsLoading) ||
    (activeTab === 'users' && usersLoading) ||
    (activeTab === 'tags' && tagsLoading)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 tap-highlight-none shrink-0"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-surface-2 rounded-2xl px-4 py-2.5">
            <Search size={18} className="text-text-secondary shrink-0" />
            <input
              type="search"
              placeholder="검색..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent text-white text-sm placeholder:text-text-muted outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setDebouncedQuery('')
                }}
                className="tap-highlight-none"
              >
                <X size={16} className="text-text-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {SEARCH_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all tap-highlight-none',
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-2 text-text-secondary'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1">
        {!debouncedQuery && (
          <div className="px-4 pt-8">
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wide mb-4">
              인기 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {['graffiti', '서울', 'streetart', '홍대', 'mural', '이태원', 'lettering', '부산'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag)
                    setDebouncedQuery(tag)
                    setActiveTab('tags')
                  }}
                  className="tag-pill tap-highlight-none hover:tag-pill-active transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="loader" />
          </div>
        )}

        {/* Posts results */}
        {activeTab === 'posts' && !postsLoading && posts && (
          <div className="px-4 pt-4">
            {posts.length === 0 && debouncedQuery ? (
              <EmptyResults query={debouncedQuery} />
            ) : (
              <PostGrid posts={posts} />
            )}
          </div>
        )}

        {/* Users results */}
        {activeTab === 'users' && !usersLoading && users && (
          <div>
            {users.length === 0 && debouncedQuery ? (
              <div className="px-4 pt-4">
                <EmptyResults query={debouncedQuery} />
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-4 px-4 py-4 hover:bg-surface/50 tap-highlight-none"
                  >
                    <Avatar src={user.avatar_url} username={user.username} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-text-secondary text-sm">@{user.username}</p>
                    </div>
                    <span className="text-text-muted text-sm">
                      게시물 {user.post_count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags results */}
        {activeTab === 'tags' && !tagsLoading && tags && (
          <div>
            {tags.length === 0 && debouncedQuery ? (
              <div className="px-4 pt-4">
                <EmptyResults query={debouncedQuery} />
              </div>
            ) : (
              <div className="px-4 pt-4 space-y-2">
                {tags.map((tag) => (
                  <button
                    key={tag.tag}
                    onClick={() => {
                      setQuery(tag.tag)
                      setDebouncedQuery(tag.tag)
                      setActiveTab('posts')
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Hash size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold">#{tag.tag}</p>
                      <p className="text-text-secondary text-sm">
                        게시물 {tag.post_count.toLocaleString()}개
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <Search size={40} className="text-text-muted" />
      <p className="text-white font-semibold">
        &ldquo;{query}&rdquo; 검색 결과 없음
      </p>
      <p className="text-text-secondary text-sm text-center">
        다른 검색어를 시도해보세요
      </p>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loader" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
