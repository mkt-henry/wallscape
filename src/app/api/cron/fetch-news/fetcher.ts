import { createAdminClient } from '@/lib/supabase/server'

interface GNewsArticle {
  title: string
  description: string
  url: string
  image: string | null
  publishedAt: string
  source: {
    name: string
    url: string
  }
}

interface GNewsResponse {
  totalArticles: number
  articles: GNewsArticle[]
}

export async function fetchGraffitiNews(): Promise<{ inserted?: number; error?: string; message?: string }> {
  const apiKey = process.env.GNEWS_API_KEY
  const botUserId = process.env.WALLSCAPE_BOT_USER_ID

  if (!apiKey || !botUserId) {
    return { error: 'Missing GNEWS_API_KEY or WALLSCAPE_BOT_USER_ID' }
  }

  try {
    const query = encodeURIComponent('graffiti OR "street art" OR "mural art"')
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=10&token=${apiKey}`

    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      console.error('GNews API error:', res.status, text)
      return { error: `GNews API failed (${res.status})` }
    }

    const data: GNewsResponse = await res.json()
    const articles = data.articles ?? []

    if (articles.length === 0) {
      return { inserted: 0, message: 'No articles found' }
    }

    const supabase = createAdminClient()

    // 기존 source_url 조회하여 중복 필터링
    const urls = articles.map((a) => a.url)
    const { data: existing } = await supabase
      .from('graffiti_news')
      .select('source_url')
      .in('source_url', urls)

    const existingUrls = new Set((existing ?? []).map((r) => r.source_url))
    const newArticles = articles.filter((a) => !existingUrls.has(a.url))

    if (newArticles.length === 0) {
      return { inserted: 0, message: 'All articles already exist' }
    }

    const rows = newArticles.map((article) => ({
      user_id: botUserId,
      title: article.title,
      content: article.description || '',
      thumbnail_url: article.image || null,
      source_url: article.url,
      source: article.source.name,
      is_auto: true,
      published_at: article.publishedAt,
      is_pinned: false,
    }))

    const { error: insertError } = await supabase.from('graffiti_news').insert(rows)

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return { error: `Insert failed: ${insertError.message}` }
    }

    return { inserted: rows.length }
  } catch (err) {
    console.error('fetch-news error:', err)
    return { error: String(err) }
  }
}
