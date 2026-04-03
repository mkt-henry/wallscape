import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '피드백',
  description: 'Wallscape 서비스에 대한 의견을 남겨주세요.',
}

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
