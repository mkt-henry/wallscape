import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const VALID_TYPES = ['feedback', 'bug', 'contact', 'partnership'] as const

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; type?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { name, email, type, message } = body

  // Validate
  if (!name?.trim()) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일을 입력해주세요.' }, { status: 400 })
  }
  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: '유형을 선택해주세요.' }, { status: 400 })
  }
  const trimmedMessage = message?.trim() ?? ''
  if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) {
    return NextResponse.json({ error: '메시지는 10자 이상 2000자 이하로 입력해주세요.' }, { status: 400 })
  }

  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('feedback').insert({
      name: name.trim(),
      email: email.trim(),
      type,
      message: trimmedMessage,
    })

    if (error) {
      console.error('Feedback insert error:', error)
      return NextResponse.json({ error: '저장 중 오류가 발생했습니다: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback unexpected error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
