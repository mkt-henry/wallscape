'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Upload, Users, ArrowRight, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Slide {
  id: number
  icon: React.ReactNode
  badge: string
  title: string
  subtitle: string
  description: string
  gradient: string
  accentColor: string
}

const slides: Slide[] = [
  {
    id: 1,
    icon: <MapPin size={48} strokeWidth={1.5} />,
    badge: '발견하다',
    title: '도시의 숨겨진\n예술을 찾아라',
    subtitle: 'DISCOVER',
    description:
      '내 주변 수백 미터 안에 숨어있는 그라피티와 스트릿 아트를 지도 위에서 발견하세요. 매일 새로운 작품들이 도시를 물들입니다.',
    gradient: 'from-primary/20 via-background to-background',
    accentColor: '#D946EF',
  },
  {
    id: 2,
    icon: <Upload size={48} strokeWidth={1.5} />,
    badge: '기록하다',
    title: '네가 발견한\n예술을 공유해',
    subtitle: 'UPLOAD',
    description:
      '사진을 찍으면 자동으로 위치 정보를 인식합니다. 태그와 설명을 추가해 당신만의 스트릿 아트 아카이브를 만들어보세요.',
    gradient: 'from-secondary/20 via-background to-background',
    accentColor: '#22D3EE',
  },
  {
    id: 3,
    icon: <Users size={48} strokeWidth={1.5} />,
    badge: '연결하다',
    title: '아티스트와\n팬들을 만나라',
    subtitle: 'CONNECT',
    description:
      '같은 도시의 아티스트를 팔로우하고, 좋아하는 작품에 반응을 남기세요. 스트릿 아트 커뮤니티의 일원이 되어보세요.',
    gradient: 'from-purple-900/20 via-background to-background',
    accentColor: '#A855F7',
  },
]

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slide = slides[currentSlide]
  const isLast = currentSlide === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      handleFinish()
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handleFinish = () => {
    localStorage.setItem('wallscape_onboarded', 'true')
    router.push('/login')
  }

  const handleSkip = () => {
    localStorage.setItem('wallscape_onboarded', 'true')
    router.push('/login')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col overflow-hidden">
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-b transition-all duration-700',
          slide.gradient
        )}
      />

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-6 pt-12">
        {!isLast && (
          <button
            onClick={handleSkip}
            className="text-text-secondary text-sm font-medium tap-highlight-none"
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {/* Icon area */}
        <div className="relative mb-12">
          {/* Background glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-30 scale-150"
            style={{ backgroundColor: slide.accentColor }}
          />

          {/* Icon container */}
          <div
            className="relative w-32 h-32 rounded-full flex items-center justify-center border border-white/10"
            style={{
              background: `radial-gradient(circle, ${slide.accentColor}20, transparent)`,
              boxShadow: `0 0 40px ${slide.accentColor}30`,
            }}
          >
            <div style={{ color: slide.accentColor }}>{slide.icon}</div>
          </div>

          {/* Badge */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-widest border"
            style={{
              backgroundColor: `${slide.accentColor}20`,
              borderColor: `${slide.accentColor}40`,
              color: slide.accentColor,
            }}
          >
            {slide.badge}
          </div>
        </div>

        {/* Subtitle */}
        <p
          className="text-xs font-black tracking-widest mb-3 opacity-60"
          style={{ color: slide.accentColor }}
        >
          {slide.subtitle}
        </p>

        {/* Title */}
        <h1 className="text-3xl font-black text-white text-center leading-tight mb-6 whitespace-pre-line">
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-center text-sm leading-relaxed max-w-xs">
          {slide.description}
        </p>
      </div>

      {/* Bottom section */}
      <div className="relative z-10 px-8 pb-12 space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="tap-highlight-none transition-all duration-300"
            >
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === currentSlide ? 'w-8' : 'w-2 bg-white/20'
                )}
                style={{
                  backgroundColor:
                    i === currentSlide ? slide.accentColor : undefined,
                }}
              />
            </button>
          ))}
        </div>

        {/* CTA button */}
        <Button
          onClick={handleNext}
          fullWidth
          size="lg"
          className="group"
          style={
            {
              '--btn-color': slide.accentColor,
              backgroundColor: slide.accentColor,
            } as React.CSSProperties
          }
        >
          <span className="flex items-center gap-2">
            {isLast ? (
              <>
                시작하기
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            ) : (
              <>
                다음
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </span>
        </Button>

        {/* Sign up link */}
        {isLast && (
          <p className="text-center text-text-secondary text-sm">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-primary font-semibold tap-highlight-none"
            >
              로그인
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
