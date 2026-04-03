import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/artist-application
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let body: { artist_name?: string; bio?: string; instagram_handle?: string; website?: string; note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { artist_name, bio, instagram_handle, website, note } = body
  if (!artist_name?.trim()) {
    return NextResponse.json({ error: '작가 이름을 입력해주세요.' }, { status: 400 })
  }

  // 이미 pending 신청이 있는지 확인
  const { data: existing } = await supabase
    .from('artist_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '이미 검토 중인 신청이 있습니다.' }, { status: 409 })
  }

  const { error: insertError } = await supabase
    .from('artist_applications')
    .insert({
      user_id: user.id,
      artist_name: artist_name.trim(),
      bio: bio?.trim() || null,
      instagram_handle: instagram_handle?.trim() || null,
      website: website?.trim() || null,
      note: note?.trim() || null,
    })

  if (insertError) {
    console.error('Artist application insert error:', insertError)
    return NextResponse.json({ error: '신청에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
