import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/posts/[id]
// 본인 게시물 수정: title, description, tags, category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { title?: string; description?: string; tags?: string[]; category?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // 본인 게시물 확인
  const { data: post } = await adminClient
    .from('posts')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { error } = await adminClient
    .from('posts')
    .update({
      title: body.title?.trim() || null,
      description: body.description?.trim() || null,
      tags: body.tags ?? [],
      category: body.category ?? null,
    })
    .eq('id', params.id)

  if (error) {
    console.error('Post update error:', error)
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
