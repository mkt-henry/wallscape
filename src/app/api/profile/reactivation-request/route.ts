import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/profile/reactivation-request
// Body: { email: string }
// 비활성화된 계정의 재활성화를 요청합니다.
export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { email } = body
  if (!email) {
    return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // auth.users에서 이메일로 유저 찾기
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
  if (listError) {
    console.error('List users error:', listError)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  const foundUser = usersData.users.find((u) => u.email === email)
  if (!foundUser) {
    return NextResponse.json({ error: '해당 이메일의 계정을 찾을 수 없습니다.' }, { status: 404 })
  }

  // 해당 유저의 profile에서 deactivated_at 확인
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, username, display_name, deactivated_at')
    .eq('id', foundUser.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 })
  }

  if (!profile.deactivated_at) {
    return NextResponse.json({ error: '비활성화된 계정이 아닙니다.' }, { status: 400 })
  }

  // 기존 pending 요청 확인
  const { data: existingRequest, error: checkError } = await adminClient
    .from('reactivation_requests')
    .select('id')
    .eq('user_id', foundUser.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (checkError) {
    console.error('Check existing request error:', checkError)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  if (existingRequest) {
    return NextResponse.json({ error: '이미 재활성화 요청이 진행 중입니다.' }, { status: 409 })
  }

  // 재활성화 요청 INSERT
  const { error: insertError } = await adminClient.from('reactivation_requests').insert({
    user_id: foundUser.id,
    email,
    username: profile.username,
    display_name: profile.display_name,
  })

  if (insertError) {
    console.error('Insert reactivation request error:', insertError)
    return NextResponse.json({ error: '요청 저장에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
