import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '업로드',
  description: '발견한 그래피티와 스트릿 아트를 Wallscape에 공유하세요.',
}

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children
}
