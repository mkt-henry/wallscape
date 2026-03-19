import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Wallscape - 위치 기반 그래피티 SNS'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#08080C',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: 24,
          }}
        >
          Wallscape
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#a855f7',
            fontWeight: 500,
          }}
        >
          위치 기반 그래피티 SNS
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#6b7280',
            marginTop: 16,
          }}
        >
          당신 주변의 스트릿 아트를 발견하고 공유하세요
        </div>
      </div>
    ),
    { ...size }
  )
}
