'use client'

import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Heart, MessageCircle } from 'lucide-react'
import { formatNumber, cn } from '@/lib/utils'
import type { PostWithUser } from '@/types'

interface PostGridProps {
  posts: PostWithUser[]
  columns?: 2 | 3
  className?: string
}

function GridItem({ post, size }: { post: PostWithUser; size: 'sm' | 'md' }) {
  return (
    <Link
      href={`/feed/${post.id}`}
      className="relative block bg-surface-2 overflow-hidden rounded-xl tap-highlight-none group"
    >
      <div className={cn(
        'relative w-full',
        size === 'sm' ? 'aspect-square' : 'aspect-[3/4]'
      )}>
        <Image
          src={post.image_url}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 33vw, 200px"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-1">
              <Heart size={16} className="fill-white" />
              <span className="text-sm font-semibold">
                {formatNumber(post.like_count)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={16} />
              <span className="text-sm font-semibold">
                {formatNumber(post.comment_count)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function PostGrid({ posts, columns = 3, className }: PostGridProps) {
  if (posts.length === 0) return null

  if (columns === 2) {
    return (
      <div className={cn('grid grid-cols-2 gap-1', className)}>
        {posts.map((post) => (
          <GridItem key={post.id} post={post} size="md" />
        ))}
      </div>
    )
  }

  // 3-column masonry-style grid
  return (
    <div className={cn('grid grid-cols-3 gap-0.5', className)}>
      {posts.map((post, index) => {
        // Make every 7th item span full width for visual variety
        const isWide = index % 7 === 3

        return (
          <div
            key={post.id}
            className={isWide ? 'col-span-2' : 'col-span-1'}
          >
            <GridItem post={post} size="sm" />
          </div>
        )
      })}
    </div>
  )
}

interface PostGridSkeletonProps {
  count?: number
  columns?: 2 | 3
}

export function PostGridSkeleton({ count = 9, columns = 3 }: PostGridSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-0.5',
      columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-square rounded-xl" />
      ))}
    </div>
  )
}
