import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '활동',
  description: '나의 좋아요, 댓글 등 최근 활동을 확인하세요.',
}

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return children
}
