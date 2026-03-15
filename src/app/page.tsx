'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Camera, Users, Compass, ArrowRight, Star } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

const FEATURES = [
  {
    icon: MapPin,
    title: '위치 기반 발견',
    desc: '내 주변 숨겨진 그라피티와 벽화를 지도에서 바로 찾아보세요.',
    color: 'from-orange-500/20 to-red-500/20',
    iconColor: 'text-orange-400',
  },
  {
    icon: Camera,
    title: '순간을 기록',
    desc: '발견한 작품을 사진으로 남기고 GPS 정보와 함께 공유하세요.',
    color: 'from-teal-500/20 to-cyan-500/20',
    iconColor: 'text-teal-400',
  },
  {
    icon: Users,
    title: '아티스트 커뮤니티',
    desc: '같은 취향의 사람들을 팔로우하고 서울의 예술을 함께 탐험하세요.',
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Compass,
    title: '도시 탐험',
    desc: '홍대, 성수, 을지로… 서울 곳곳의 예술 지도를 완성해 가세요.',
    color: 'from-blue-500/20 to-indigo-500/20',
    iconColor: 'text-blue-400',
  },
]

const STATS = [
  { value: '1,200+', label: '등록된 작품' },
  { value: '340+', label: '활성 유저' },
  { value: '25+', label: '서울 동네' },
  { value: '4.9', label: '평균 평점', icon: Star },
]

const PREVIEW_IMAGES = [
  { seed: 'wall3', area: '성수동' },
  { seed: 'wall7', area: '해방촌' },
  { seed: 'wall9', area: '익선동' },
  { seed: 'wall4', area: '성수동' },
  { seed: 'wall5', area: '을지로' },
  { seed: 'wall1', area: '홍대' },
]

function LandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isInitialized, isLoading, user } = useAuthStore()

  useEffect(() => {
    // OAuth fallback: if code lands on root, forward to /auth/callback
    const code = searchParams.get('code')
    if (code) {
      router.replace(`/auth/callback?code=${code}`)
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-glow-primary">
              <span className="text-sm font-black text-white">W</span>
            </div>
            <span className="text-lg font-black tracking-wide">WALLSCAPE</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm text-text-secondary hover:text-white transition-colors tap-highlight-none"
                >
                  내 프로필
                </Link>
                <Link
                  href="/feed"
                  className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors tap-highlight-none"
                >
                  피드 보기
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-text-secondary hover:text-white transition-colors tap-highlight-none"
                >
                  로그인
                </Link>
                <Link
                  href="/feed"
                  className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors tap-highlight-none"
                >
                  둘러보기
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold">국내 위치 기반 스트릿 아트 SNS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            도시의 예술을<br />
            <span className="text-gradient-primary">발견하다</span>
          </h1>

          <p className="text-text-secondary text-lg md:text-xl leading-relaxed max-w-xl mb-10">
            골목 어딘가에 숨어있는 그라피티, 벽화, 스트릿 아트.<br />
            Wallscape로 기록하고 공유하세요.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/feed"
              className="flex items-center gap-2 bg-primary text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-primary/90 transition-all active:scale-95 tap-highlight-none shadow-glow-primary"
            >
              지금 둘러보기
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link
                href="/signup"
                className="flex items-center gap-2 bg-surface-2 text-white font-semibold px-7 py-3.5 rounded-2xl border border-border hover:bg-surface-3 transition-all active:scale-95 tap-highlight-none"
              >
                무료 가입
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Preview grid ────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {PREVIEW_IMAGES.map(({ seed, area }, i) => (
              <Link
                key={seed}
                href="/feed"
                className={`relative rounded-2xl overflow-hidden tap-highlight-none group
                  ${i === 0 || i === 3 ? 'aspect-[3/4]' : 'aspect-square'}
                `}
              >
                <Image
                  src={`https://picsum.photos/seed/${seed}/400/500`}
                  alt={area}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-xs font-semibold flex items-center gap-1">
                    <MapPin size={10} />
                    {area}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────── */}
      <section className="px-6 py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {Icon && <Icon size={18} className="text-yellow-400 fill-yellow-400" />}
                <span className="text-3xl md:text-4xl font-black text-gradient-primary">{value}</span>
              </div>
              <p className="text-text-secondary text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              도시를 새롭게 보는 방법
            </h2>
            <p className="text-text-secondary text-base">
              Wallscape가 제공하는 네 가지 경험
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, iconColor }) => (
              <div
                key={title}
                className={`relative bg-gradient-to-br ${color} border border-white/5 rounded-3xl p-6 overflow-hidden group hover:border-white/10 transition-colors`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-black/30 flex items-center justify-center mb-4`}>
                  <Icon size={24} className={iconColor} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-primary/20 to-orange-400/10 border border-primary/20 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
                <span className="text-3xl font-black text-white">W</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                지금 바로 탐험하세요
              </h2>
              <p className="text-text-secondary text-base mb-8 max-w-md mx-auto">
                로그인 없이도 서울 곳곳의 스트릿 아트를 구경할 수 있어요.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/feed"
                  className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-95 tap-highlight-none shadow-glow-primary"
                >
                  피드 둘러보기
                  <ArrowRight size={18} />
                </Link>
                {!user && (
                  <Link
                    href="/signup"
                    className="flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/15 transition-all active:scale-95 tap-highlight-none"
                  >
                    회원가입
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="px-6 py-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <span className="text-xs font-black text-white">W</span>
            </div>
            <span className="text-sm font-bold text-white">WALLSCAPE</span>
          </div>
          <p className="text-text-muted text-xs text-center">
            © 2025 Wallscape. 서울의 예술을 기록합니다.
          </p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <Link href="/feed" className="hover:text-white transition-colors">피드</Link>
            <Link href="/login" className="hover:text-white transition-colors">로그인</Link>
            <Link href="/signup" className="hover:text-white transition-colors">회원가입</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingContent />
    </Suspense>
  )
}
