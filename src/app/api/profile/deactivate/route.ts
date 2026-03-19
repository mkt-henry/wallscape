import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/profile/deactivate
// 인증된 유저의 계정을 비활성화합니다.
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // profiles 테이블에 deactivated_at 업데이트
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ deactivated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile deactivate error:', profileError)
      return NextResponse.json({ error: '계정 비활성화에 실패했습니다.' }, { status: 500 })
    }

    // auth.users에서 밴 처리 (10년 = 87600시간)
    const { error: banError } = await adminClient.auth.admin.updateUserById(user.id, {
      ban_duration: '87600h',
    })

    if (banError) {
      console.error('Ban user error:', banError)
      // 프로필은 이미 비활성화됐으므로 롤백 없이 오류 반환
      return NextResponse.json({ error: '계정 밴 처리에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Deactivate route error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
