import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '지도',
  description: '지도에서 내 주변 그래피티와 벽화의 위치를 확인하세요.',
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}
