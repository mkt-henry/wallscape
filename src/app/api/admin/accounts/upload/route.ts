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

// GET /api/admin/accounts/upload?user_id=xxx — list posts for a fake account
export async function GET(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error: 'user_id가 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: posts, error: postsError } = await adminClient
    .from('posts')
    .select('id, title, description, tags, image_url, lat, lng, address, city, district, visibility, like_count, comment_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (postsError) {
    console.error('Admin posts list error:', postsError)
    return NextResponse.json({ error: '게시물을 불러올 수 없습니다.' }, { status: 500 })
  }

  return NextResponse.json({ posts: posts ?? [] })
}

// PATCH /api/admin/accounts/upload — edit a post (supports image replacement via FormData)
export async function PATCH(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const formData = await request.formData()
  const postId = formData.get('post_id') as string
  if (!postId) {
    return NextResponse.json({ error: 'post_id가 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Build update object from form fields
  const updateData: Record<string, unknown> = {}

  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const tagsRaw = formData.get('tags') as string | null
  const lat = formData.get('lat') as string | null
  const lng = formData.get('lng') as string | null
  const address = formData.get('address') as string | null
  const city = formData.get('city') as string | null
  const district = formData.get('district') as string | null
  const visibility = formData.get('visibility') as string | null

  if (title !== null) updateData.title = title.trim()
  if (description !== null) updateData.description = description.trim() || null
  if (tagsRaw !== null) updateData.tags = JSON.parse(tagsRaw)
  if (lat !== null) updateData.lat = parseFloat(lat)
  if (lng !== null) updateData.lng = parseFloat(lng)
  if (address !== null) updateData.address = address || null
  if (city !== null) updateData.city = city || null
  if (district !== null) updateData.district = district || null
  if (visibility !== null) updateData.visibility = visibility

  // Handle image replacement
  const image = formData.get('image') as File | null
  if (image && image.size > 0) {
    // Get existing post to find user_id
    const { data: existing } = await adminClient
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: '게시물을 찾을 수 없습니다.' }, { status: 404 })
    }

    const ext = image.name.split('.').pop() || 'jpg'
    const storagePath = `${existing.user_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buffer = Buffer.from(await image.arrayBuffer())

    const { error: uploadError } = await adminClient.storage
      .from('post-images')
      .upload(storagePath, buffer, {
        contentType: image.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Admin image replace error:', uploadError)
      return NextResponse.json({ error: `이미지 업로드 실패: ${uploadError.message}` }, { status: 500 })
    }

    updateData.image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${storagePath}`
  }

  const { data: post, error: updateError } = await adminClient
    .from('posts')
    .update(updateData)
    .eq('id', postId)
    .select()
    .single()

  if (updateError) {
    console.error('Admin post update error:', updateError)
    return NextResponse.json({ error: `수정 실패: ${updateError.message}` }, { status: 500 })
  }

  return NextResponse.json({ post })
}

// DELETE /api/admin/accounts/upload — delete a post
export async function DELETE(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  let body: { post_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (!body.post_id) {
    return NextResponse.json({ error: 'post_id가 필요합니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('posts').delete().eq('id', body.post_id)

  if (error) {
    console.error('Admin post delete error:', error)
    return NextResponse.json({ error: `삭제 실패: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// POST /api/admin/accounts/upload — upload a post as a fake account
export async function POST(request: NextRequest) {
  const user = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const formData = await request.formData()
  const userId = formData.get('user_id') as string
  const image = formData.get('image') as File | null
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const tags = JSON.parse((formData.get('tags') as string) || '[]')
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const address = (formData.get('address') as string) || null
  const city = (formData.get('city') as string) || null
  const district = (formData.get('district') as string) || null
  const visibility = (formData.get('visibility') as string) || 'public'

  if (!userId || !image || !title || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: '필수 항목이 누락되었습니다. (user_id, image, title, lat, lng)' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Verify it's a fake account via auth metadata
  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(userId)
  if (authError || !authData?.user?.user_metadata?.is_fake) {
    return NextResponse.json(
      { error: '가계정으로만 게시물을 업로드할 수 있습니다.' },
      { status: 400 }
    )
  }

  // Upload image to storage
  const ext = image.name.split('.').pop() || 'jpg'
  const storagePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buffer = Buffer.from(await image.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('post-images')
    .upload(storagePath, buffer, {
      contentType: image.type || 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.error('Admin upload error:', uploadError)
    return NextResponse.json(
      { error: `이미지 업로드 실패: ${uploadError.message}` },
      { status: 500 }
    )
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/${storagePath}`

  // Create post record
  const { data: post, error: postError } = await adminClient
    .from('posts')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      title: title.trim(),
      description: description?.trim() || null,
      tags,
      lat,
      lng,
      address,
      city,
      district,
      visibility,
    })
    .select()
    .single()

  if (postError) {
    console.error('Admin create post error:', postError)
    return NextResponse.json(
      { error: `게시물 생성 실패: ${postError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ post }, { status: 201 })
}
