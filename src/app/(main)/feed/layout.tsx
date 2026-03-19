import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '피드',
  description: '주변 그래피티와 스트릿 아트 최신 게시물을 둘러보세요.',
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
