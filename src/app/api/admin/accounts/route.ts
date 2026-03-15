import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

async function getAuthorizedUser() {
  try {
    const supabase = await createClient()
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 8000)),
    ])
    const { data: { user }, error } = result

    if (error || !user || user.email !== ADMIN_EMAIL) {
      return null
    }

    return user
  } catch {
    return null
  }
}

// GET /api/admin/accounts — list fake accounts
export async function GET() {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const adminClient = createAdminClient()

  // Get all profiles, then check each for is_fake metadata
  const { data: allProfiles, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profileError) {
    console.error('Admin profiles fetch error:', profileError)
    return NextResponse.json({ error: '프로필을 불러올 수 없습니다.' }, { status: 500 })
  }

  // Check auth metadata for each profile in parallel
  const checks = await Promise.all(
    (allProfiles ?? []).map(async (profile) => {
      const { data } = await adminClient.auth.admin.getUserById(profile.id)
      return { profile, isFake: data?.user?.user_metadata?.is_fake === true }
    })
  )

  const fakeProfiles = checks
    .filter((c) => c.isFake)
    .map((c) => c.profile)

  return NextResponse.json({ accounts: fakeProfiles })
}

// POST /api/admin/accounts — create a fake account
export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  let body: {
    username?: string
    display_name?: string
    bio?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { username, display_name, bio } = body

  if (!username) {
    return NextResponse.json(
      { error: '사용자명은 필수입니다.' },
      { status: 400 }
    )
  }

  // Auto-generate internal email & password (not used for login)
  const rand = Math.random().toString(36).slice(2, 10)
  const email = `fake_${username}_${rand}@wallscape.internal`
  const password = crypto.randomUUID()

  const adminClient = createAdminClient()

  // Check if username is already taken
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existingProfile) {
    return NextResponse.json(
      { error: '이미 사용 중인 사용자명입니다.' },
      { status: 409 }
    )
  }

  // Create auth user with is_fake metadata
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { is_fake: true },
  })

  if (authError) {
    console.error('Admin create user error:', authError)
    return NextResponse.json(
      { error: `계정 생성 실패: ${authError.message}` },
      { status: 500 }
    )
  }

  // Create profile
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      username,
      display_name: display_name || username,
      bio: bio || null,
    })
    .select()
    .single()

  if (profileError) {
    console.error('Admin create profile error:', profileError)
    // Clean up auth user
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json(
      { error: `프로필 생성 실패: ${profileError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ account: profile }, { status: 201 })
}

// PATCH /api/admin/accounts — update a fake account profile
export async function PATCH(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const formData = await request.formData()
  const id = formData.get('id') as string
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Verify it's a fake account
  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(id)
  if (authError || !authData?.user?.user_metadata?.is_fake) {
    return NextResponse.json({ error: '가계정만 수정할 수 있습니다.' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  const username = formData.get('username') as string | null
  const displayName = formData.get('display_name') as string | null
  const bio = formData.get('bio') as string | null

  if (username !== null && username.trim()) updateData.username = username.trim()
  if (displayName !== null) updateData.display_name = displayName.trim() || null
  if (bio !== null) updateData.bio = bio.trim() || null

  // Handle avatar upload
  const avatar = formData.get('avatar') as File | null
  if (avatar && avatar.size > 0) {
    const ext = avatar.name.split('.').pop() || 'jpg'
    const storagePath = `${id}/avatar_${Date.now()}.${ext}`
    const buffer = Buffer.from(await avatar.arrayBuffer())

    const { error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(storagePath, buffer, {
        contentType: avatar.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return NextResponse.json({ error: `아바타 업로드 실패: ${uploadError.message}` }, { status: 500 })
    }

    updateData.avatar_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${storagePath}`
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 })
  }

  // Check username uniqueness if changed
  if (updateData.username) {
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', updateData.username as string)
      .neq('id', id)
      .single()
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 사용자명입니다.' }, { status: 409 })
    }
  }

  const { data: profile, error: updateError } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Profile update error:', updateError)
    return NextResponse.json({ error: `프로필 수정 실패: ${updateError.message}` }, { status: 500 })
  }

  return NextResponse.json({ account: profile })
}

// DELETE /api/admin/accounts — delete a fake account
export async function DELETE(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  let body: { id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { id } = body
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Verify it's a fake account via auth metadata
  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(id)
  if (authError || !authData?.user?.user_metadata?.is_fake) {
    return NextResponse.json(
      { error: '가계정만 삭제할 수 있습니다.' },
      { status: 400 }
    )
  }

  // Delete auth user (profile may cascade or we delete it manually)
  const { error: deleteProfileErr } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', id)

  if (deleteProfileErr) {
    console.error('Profile delete error:', deleteProfileErr)
  }

  const { error } = await adminClient.auth.admin.deleteUser(id)

  if (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: '계정 삭제에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
