import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/sync-counts
 * Syncs like_count, bookmark_count, or comment_count on a post.
 * Uses service role to bypass RLS.
 */
export async function POST(req: NextRequest) {
  const { postId, type } = (await req.json()) as {
    postId?: string
    type?: 'like' | 'bookmark' | 'comment'
  }

  if (!postId || !type) {
    return NextResponse.json({ error: 'Missing postId or type' }, { status: 400 })
  }

  const tableMap = {
    like: 'likes',
    bookmark: 'bookmarks',
    comment: 'comments',
  } as const

  const columnMap = {
    like: 'like_count',
    bookmark: 'bookmark_count',
    comment: 'comment_count',
  } as const

  const table = tableMap[type]
  const column = columnMap[type]

  const supabase = createAdminClient()

  // Count rows
  const { count, error: countError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 })
  }

  // Update post count column
  const { error: updateError } = await supabase
    .from('posts')
    .update({ [column]: count ?? 0 })
    .eq('id', postId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ [column]: count ?? 0 })
}
