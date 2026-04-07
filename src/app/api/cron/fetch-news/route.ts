import { NextResponse } from 'next/server'
import { fetchGraffitiNews } from './fetcher'

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await fetchGraffitiNews()
  return NextResponse.json(result, { status: result.error ? 500 : 200 })
}
