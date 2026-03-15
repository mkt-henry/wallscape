'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search, Layers, Navigation, X } from 'lucide-react'
import { useMapStore } from '@/stores/useMapStore'
import { useLocation } from '@/hooks/useLocation'
import { MarkerBottomSheet } from '@/components/map/MarkerBottomSheet'

// Load Kakao map only on client
const KakaoMap = dynamic(
  () => import('@/components/map/KakaoMap').then((m) => m.KakaoMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-surface-2 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="loader" />
          <p className="text-text-secondary text-sm">지도 로딩 중...</p>
        </div>
      </div>
    ),
  }
)

function MapContent() {
  const searchParams = useSearchParams()
  const { center, setCenter, isBottomSheetOpen, closePostSheet } = useMapStore()
  const { location, requestLocation } = useLocation()

  // Handle URL params
  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (lat && lng) {
      setCenter({ lat: parseFloat(lat), lng: parseFloat(lng) })
    }
  }, [searchParams, setCenter])

  const handleMyLocation = () => {
    if (location) {
      setCenter({ lat: location.lat, lng: location.lng })
    } else {
      requestLocation()
    }
  }

  return (
    <div className="relative w-full h-dvh bg-background overflow-hidden">
      {/* Map fills entire screen */}
      <div className="absolute inset-0">
        <KakaoMap />
      </div>

      {/* Top search bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-safe-top">
        <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3 shadow-card">
          <Search size={18} className="text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="장소, 주소 검색..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-text-muted outline-none"
            readOnly
            onClick={() => {/* open search */}}
          />
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6 z-10 flex flex-col gap-2">
        {/* Layer toggle */}
        <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center tap-highlight-none shadow-card">
          <Layers size={20} className="text-white" />
        </button>

        {/* My location */}
        <button
          onClick={handleMyLocation}
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center tap-highlight-none shadow-card"
        >
          <Navigation
            size={20}
            className={location ? 'text-primary' : 'text-white'}
            fill={location ? '#FF6B35' : 'none'}
          />
        </button>
      </div>

      {/* Post count overlay */}
      <div className="absolute left-4 bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6 z-10">
        <div className="glass rounded-2xl px-4 py-2 shadow-card">
          <p className="text-white text-xs font-semibold">이 지역 게시물</p>
          <p className="text-primary text-lg font-black leading-tight">-</p>
        </div>
      </div>

      {/* Bottom sheet */}
      {isBottomSheetOpen && (
        <>
          <div
            className="absolute inset-0 z-20"
            onClick={closePostSheet}
          />
          <div className="absolute left-0 right-0 bottom-0 z-30">
            <MarkerBottomSheet />
          </div>
        </>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-dvh bg-background flex items-center justify-center">
        <div className="loader" />
      </div>
    }>
      <MapContent />
    </Suspense>
  )
}
