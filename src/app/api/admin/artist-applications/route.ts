import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

async function getAuthorizedUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user || user.email !== ADMIN_EMAIL) return null
    return user
  } catch {
    return null
  }
}

// GET /api/admin/artist-applications
export async function GET() {
  const user = await getAuthorizedUser()
  if (!user) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('artist_applications')
    .select('*, profiles(username, display_name, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Admin artist applications GET error:', error)
    return NextResponse.json({ error: '데이터를 불러올 수 없습니다.' }, { status: 500 })
  }

  return NextResponse.json({ applications: data ?? [] })
}

// PATCH /api/admin/artist-applications
// Body: { id, action: 'approve' | 'reject', admin_note? }
export async function PATCH(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  let body: { id?: string; action?: string; admin_note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { id, action, admin_note } = body
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'id와 action(approve|reject)이 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  const { data: app, error: fetchError } = await adminClient
    .from('artist_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !app) {
    return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (action === 'approve') {
    // profiles.is_verified = true 설정
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        is_verified: true,
        display_name: app.artist_name,
        bio: app.bio ?? undefined,
        instagram_handle: app.instagram_handle ?? undefined,
        website: app.website ?? undefined,
      })
      .eq('id', app.user_id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({ error: '프로필 업데이트에 실패했습니다.' }, { status: 500 })
    }
  }

  const { error: updateError } = await adminClient
    .from('artist_applications')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', admin_note: admin_note ?? null, processed_at: now })
    .eq('id', id)

  if (updateError) {
    console.error('Update artist application error:', updateError)
    return NextResponse.json({ error: '상태 업데이트에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
