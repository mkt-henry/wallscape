import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/posts/[id]/artist-tags
// 로그인한 유저라면 누구나 tagged_artist_ids만 수정 가능
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { artistIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { artistIds } = body
  if (!Array.isArray(artistIds)) {
    return NextResponse.json({ error: 'artistIds 배열이 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('posts')
    .update({ tagged_artist_ids: artistIds })
    .eq('id', params.id)

  if (error) {
    console.error('Artist tags update error:', error)
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
