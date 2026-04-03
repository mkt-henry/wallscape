'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { MapPin, Upload, Users, ArrowRight, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Slide {
  id: number
  icon: React.ReactNode
  badgeKey: string
  titleKey: string
  subtitle: string
  descKey: string
  gradient: string
  accentColor: string
}

const slides: Slide[] = [
  {
    id: 1,
    icon: <MapPin size={48} strokeWidth={1.5} />,
    badgeKey: 'badge1',
    titleKey: 'title1',
    subtitle: 'DISCOVER',
    descKey: 'desc1',
    gradient: 'from-primary/20 via-background to-background',
    accentColor: '#D946EF',
  },
  {
    id: 2,
    icon: <Upload size={48} strokeWidth={1.5} />,
    badgeKey: 'badge2',
    titleKey: 'title2',
    subtitle: 'UPLOAD',
    descKey: 'desc2',
    gradient: 'from-secondary/20 via-background to-background',
    accentColor: '#22D3EE',
  },
  {
    id: 3,
    icon: <Users size={48} strokeWidth={1.5} />,
    badgeKey: 'badge3',
    titleKey: 'title3',
    subtitle: 'CONNECT',
    descKey: 'desc3',
    gradient: 'from-purple-900/20 via-background to-background',
    accentColor: '#A855F7',
  },
]

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()
  const t = useTranslations('onboarding')
  const tc = useTranslations('common')

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
            {tc('skip')}
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
            {t(slide.badgeKey)}
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
          {t(slide.titleKey)}
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-center text-sm leading-relaxed max-w-xs">
          {t(slide.descKey)}
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
                {tc('start')}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            ) : (
              <>
                {tc('next')}
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
            {t('haveAccount')}{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-primary font-semibold tap-highlight-none"
            >
              {tc('login')}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
