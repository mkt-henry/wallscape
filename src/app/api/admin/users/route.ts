import { NextResponse } from 'next/server'
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

// GET /api/admin/users — list real (non-fake) users with email & stats
export async function GET() {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  const { data: allProfiles, error: profileError } = await adminClient
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, post_count, follower_count, following_count, created_at')
    .order('created_at', { ascending: false })

  if (profileError) {
    return NextResponse.json({ error: '프로필을 불러올 수 없습니다.' }, { status: 500 })
  }

  // 각 프로필의 auth 메타데이터 확인 (실제 유저 필터링)
  const checks = await Promise.all(
    (allProfiles ?? []).map(async (profile) => {
      const { data } = await adminClient.auth.admin.getUserById(profile.id)
      const authUser = data?.user
      const isFake = authUser?.user_metadata?.is_fake === true
      return {
        profile,
        isFake,
        email: authUser?.email ?? null,
        lastSignIn: authUser?.last_sign_in_at ?? null,
      }
    })
  )

  const realUsers = checks
    .filter((c) => !c.isFake)
    .map((c) => ({
      ...c.profile,
      email: c.email,
      last_sign_in_at: c.lastSignIn,
    }))

  return NextResponse.json({ users: realUsers })
}
