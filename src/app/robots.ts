import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 검색엔진
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth/', '/onboarding', '/profile/settings'],
      },
      // Google
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Googlebot-Image', allow: '/' },
      // Google AI (SGE / AI Overviews) — GEO
      { userAgent: 'Google-Extended', allow: '/' },
      // Bing
      { userAgent: 'Bingbot', allow: '/' },
      // Naver
      { userAgent: 'Yeti', allow: '/' },
      // OpenAI / ChatGPT — GEO
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      // Anthropic / Claude — GEO
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      // Perplexity — GEO
      { userAgent: 'PerplexityBot', allow: '/' },
      // Meta AI — GEO
      { userAgent: 'FacebookBot', allow: '/' },
      // Apple
      { userAgent: 'Applebot', allow: '/' },
      // Common Crawl (AI 학습 데이터) — GEO
      { userAgent: 'CCBot', allow: '/' },
      // Cohere — GEO
      { userAgent: 'cohere-ai', allow: '/' },
    ],
    sitemap: 'https://wallscape.bp-studio.com/sitemap.xml',
    host: 'https://wallscape.bp-studio.com',
  }
}
