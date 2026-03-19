import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입',
  description: 'Wallscape에 가입하고 위치 기반 스트릿 아트 커뮤니티에 참여하세요.',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
