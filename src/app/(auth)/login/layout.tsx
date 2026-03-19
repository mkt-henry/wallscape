import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
  description: 'Wallscape에 로그인하고 주변 그래피티를 발견하세요.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
