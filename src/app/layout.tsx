import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Wallscape',
    template: '%s | Wallscape',
  },
  description: '당신 주변의 그라피티를 발견하고 공유하세요 - 위치 기반 스트릿 아트 SNS',
  keywords: ['그라피티', '스트릿아트', 'street art', 'graffiti', '위치기반', 'SNS'],
  authors: [{ name: 'Wallscape Team' }],
  creator: 'Wallscape',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wallscape',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Wallscape - 위치 기반 그라피티 SNS',
    description: '당신 주변의 그라피티를 발견하고 공유하세요',
    siteName: 'Wallscape',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wallscape',
    description: '위치 기반 그라피티 SNS',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="preconnect" href="https://dapi.kakao.com" />
      </head>
      <body className="bg-background text-white antialiased tap-highlight-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
