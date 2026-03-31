'use client'

import Link from 'next/link'
import { Search, CheckCircle2, Instagram } from 'lucide-react'
import { useState } from 'react'
import { useVerifiedArtists } from '@/hooks/useArtists'
import { Avatar } from '@/components/ui/Avatar'
import { formatNumber } from '@/lib/utils'

function ArtistSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl">
      <div className="skeleton w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  )
}

export default function ArtistsPage() {
  const [search, setSearch] = useState('')
  const { data: artists = [], isLoading } = useVerifiedArtists()

  const filtered = search.trim()
    ? artists.filter(
        (a) =>
          a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          a.username.toLowerCase().includes(search.toLowerCase())
      )
    : artists

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-xl font-black text-white">작가</h1>
          </div>

          {/* Search */}
          <div className="pb-3">
            <div className="flex items-center gap-2 bg-surface-2 rounded-full px-4 py-2.5">
              <Search size={18} className="text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="작가 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-text-muted outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <ArtistSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
              <span className="text-3xl">🎨</span>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">
                {search.trim() ? '검색 결과가 없습니다' : '등록된 작가가 없습니다'}
              </p>
              <p className="text-text-secondary text-sm">
                인증된 스트릿 아티스트가 여기에 표시됩니다
              </p>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((artist) => (
              <Link
                key={artist.id}
                href={`/profile/${artist.username}`}
                className="flex items-center gap-4 p-4 bg-surface rounded-2xl tap-highlight-none hover:bg-surface-2 transition-colors"
              >
                <Avatar
                  src={artist.avatar_url}
                  username={artist.username}
                  size="lg"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold truncate">
                      {artist.display_name || artist.username}
                    </p>
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-text-secondary text-sm truncate">@{artist.username}</p>
                    {artist.instagram_handle && (
                      <span className="flex items-center gap-0.5 text-text-muted text-xs shrink-0">
                        <Instagram size={11} />
                        @{artist.instagram_handle}
                      </span>
                    )}
                  </div>
                  {artist.bio && (
                    <p className="text-text-secondary text-xs mt-1 line-clamp-1">{artist.bio}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-sm font-semibold">{formatNumber(artist.post_count)}</p>
                  <p className="text-text-muted text-xs">작품</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
