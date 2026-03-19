import type { MetadataRoute } from 'next'

const BASE_URL = 'https://wallscape.bp-studio.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // ─── 핵심 페이지 ───────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // ─── 콘텐츠 탐색 (AEO: 사용자 질문에 직접 답하는 페이지) ──
    {
      url: `${BASE_URL}/feed`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    // ─── 커뮤니티 ─────────────────────────────────────────────
    {
      url: `${BASE_URL}/activity`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.7,
    },
    // ─── 참여 유도 ────────────────────────────────────────────
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
