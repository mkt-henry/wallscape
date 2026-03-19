import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const formData = await request.formData()
  const avatar = formData.get('avatar') as File | null

  if (!avatar || avatar.size === 0) {
    return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 })
  }

  if (avatar.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: '이미지 크기는 5MB 이하여야 합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const ext = avatar.name.split('.').pop() || 'jpg'
  const storagePath = `${user.id}/avatar_${Date.now()}.${ext}`
  const buffer = Buffer.from(await avatar.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(storagePath, buffer, { contentType: avatar.type || 'image/jpeg', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: `업로드 실패: ${uploadError.message}` }, { status: 500 })
  }

  const avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${storagePath}`

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: '프로필 업데이트 실패' }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}
