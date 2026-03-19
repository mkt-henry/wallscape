import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '검색',
  description: '그래피티, 작가, 위치를 검색해보세요.',
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
