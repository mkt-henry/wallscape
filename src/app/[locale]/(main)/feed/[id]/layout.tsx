import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://wallscape.bp-studio.com'

interface Props {
  params: { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, description, image_url, tags, city, address')
    .eq('id', params.id)
    .single()

  if (!post) {
    return {
      title: '게시물을 찾을 수 없습니다',
    }
  }

  const title = post.title || '그래피티 작품'
  const location = post.address || post.city || ''
  const description = post.description
    ? `${post.description}${location ? ` · ${location}` : ''}`
    : location
      ? `${location}의 그래피티`
      : '위치 기반 그래피티 SNS Wallscape에서 발견된 스트릿 아트'
  const url = `${BASE_URL}/feed/${post.id}`

  return {
    title,
    description,
    keywords: [
      '그래피티',
      '스트릿아트',
      ...(post.tags ?? []),
      ...(location ? [location] : []),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      images: post.image_url
        ? [{ url: post.image_url, width: 1200, height: 1200, alt: title }]
        : [],
      siteName: 'Wallscape',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.image_url ? [post.image_url] : [],
    },
  }
}

export default function PostDetailLayout({ children }: Props) {
  return <>{children}</>
}
