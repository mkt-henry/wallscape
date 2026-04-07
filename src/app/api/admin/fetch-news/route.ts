import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGraffitiNews } from '@/app/api/cron/fetch-news/fetcher'

const ADMIN_EMAIL = 'bpark0718@gmail.com'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await fetchGraffitiNews()
  return NextResponse.json(result, { status: result.error ? 500 : 200 })
}
