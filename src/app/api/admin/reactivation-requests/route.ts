import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

async function getAuthorizedUser() {
  try {
    const supabase = await createClient()
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 8000)
      ),
    ])
    const {
      data: { user },
      error,
    } = result

    if (error || !user || user.email !== ADMIN_EMAIL) {
      return null
    }

    return user
  } catch {
    return null
  }
}

// GET /api/admin/reactivation-requests
// pending 상태의 재활성화 요청 목록을 반환합니다.
export async function GET() {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('reactivation_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('Admin reactivation requests GET error:', error)
    return NextResponse.json({ error: '데이터를 불러올 수 없습니다.' }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

// PATCH /api/admin/reactivation-requests
// Body: { id: string, action: 'approve' | 'reject', admin_note?: string }
export async function PATCH(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  let body: { id?: string; action?: string; admin_note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { id, action, admin_note } = body
  if (!id || !action) {
    return NextResponse.json({ error: 'id와 action이 필요합니다.' }, { status: 400 })
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: "action은 'approve' 또는 'reject'여야 합니다." }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // 요청 정보 조회
  const { data: reqData, error: fetchError } = await adminClient
    .from('reactivation_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !reqData) {
    return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (action === 'approve') {
    // 밴 해제
    const { error: unbanError } = await adminClient.auth.admin.updateUserById(reqData.user_id, {
      ban_duration: 'none',
    })
    if (unbanError) {
      console.error('Unban user error:', unbanError)
      return NextResponse.json({ error: '계정 밴 해제에 실패했습니다.' }, { status: 500 })
    }

    // profiles deactivated_at 초기화
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ deactivated_at: null })
      .eq('id', reqData.user_id)

    if (profileError) {
      console.error('Profile reactivate error:', profileError)
      return NextResponse.json({ error: '프로필 복구에 실패했습니다.' }, { status: 500 })
    }

    // 요청 상태 업데이트
    const { error: updateError } = await adminClient
      .from('reactivation_requests')
      .update({ status: 'approved', processed_at: now })
      .eq('id', id)

    if (updateError) {
      console.error('Update reactivation request error:', updateError)
      return NextResponse.json({ error: '요청 상태 업데이트에 실패했습니다.' }, { status: 500 })
    }
  } else {
    // reject
    const { error: updateError } = await adminClient
      .from('reactivation_requests')
      .update({
        status: 'rejected',
        admin_note: admin_note ?? null,
        processed_at: now,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update reactivation request error:', updateError)
      return NextResponse.json({ error: '요청 상태 업데이트에 실패했습니다.' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
