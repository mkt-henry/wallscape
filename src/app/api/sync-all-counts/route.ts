import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/sync-all-counts
 * One-time sync: recalculates like_count, bookmark_count, comment_count
 * for ALL posts based on actual row counts.
 */
export async function POST() {
  const supabase = createAdminClient()

  // Get all posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id')

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 })
  }

  const results: { id: string; like_count: number; bookmark_count: number; comment_count: number }[] = []

  for (const post of posts ?? []) {
    const [likes, bookmarks, comments] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    ])

    const counts = {
      like_count: likes.count ?? 0,
      bookmark_count: bookmarks.count ?? 0,
      comment_count: comments.count ?? 0,
    }

    await supabase.from('posts').update(counts).eq('id', post.id)
    results.push({ id: post.id, ...counts })
  }

  return NextResponse.json({ synced: results.length, results })
}
