import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'bpark0718@gmail.com'
const PAGE_SIZE = 50

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

// GET /api/admin/feedback
// Query params: page (1-based), type, unread
export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const typeFilter = searchParams.get('type') // feedback | bug | contact | partnership | null
  const unreadOnly = searchParams.get('unread') === 'true'

  const adminClient = createAdminClient()
  let query = adminClient
    .from('feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (typeFilter && ['feedback', 'bug', 'contact', 'partnership'].includes(typeFilter)) {
    query = query.eq('type', typeFilter)
  }

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Admin feedback GET error:', error)
    return NextResponse.json({ error: '데이터를 불러올 수 없습니다.' }, { status: 500 })
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  })
}

// PATCH /api/admin/feedback
// Body: { id: string } — marks item as read
export async function PATCH(request: NextRequest) {
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
  const { data, error } = await adminClient
    .from('feedback')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Admin feedback PATCH error:', error)
    return NextResponse.json({ error: '업데이트에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}

// DELETE /api/admin/feedback
// Body: { id: string }
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
  const { error } = await adminClient.from('feedback').delete().eq('id', id)

  if (error) {
    console.error('Admin feedback DELETE error:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
