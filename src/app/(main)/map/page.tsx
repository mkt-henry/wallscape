'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Navigation } from 'lucide-react'
import { useMapStore } from '@/stores/useMapStore'
import { useLocation } from '@/hooks/useLocation'
import { useNearbyPosts } from '@/hooks/useNearbyPosts'
import { MarkerBottomSheet } from '@/components/map/MarkerBottomSheet'
import { NearbyPostsModal } from '@/components/map/NearbyPostsModal'
import { loadKakaoScript } from '@/lib/kakao'

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

// Prefetch Kakao SDK as early as possible (parallel with data fetch)
if (typeof window !== 'undefined') {
  loadKakaoScript().catch(() => {})
}

function MapContent() {
  const searchParams = useSearchParams()
  const { center, zoom, setCenter, isBottomSheetOpen, closePostSheet, visiblePostCount, visiblePosts } = useMapStore()
  const { location, requestLocation } = useLocation()
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false)

  // Fetch nearby posts immediately — no need to wait for Kakao SDK
  const { data: prefetchedPosts } = useNearbyPosts(center.lat, center.lng, zoom)

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
        <KakaoMap prefetchedPosts={prefetchedPosts} />
      </div>

      {/* Map controls */}
      <div className="absolute right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6 z-10 flex flex-col gap-2">
        {/* My location */}
        <button
          onClick={handleMyLocation}
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center tap-highlight-none shadow-card"
        >
          <Navigation
            size={20}
            className={location ? 'text-primary' : 'text-white'}
            fill={location ? '#D946EF' : 'none'}
          />
        </button>
      </div>

      {/* Post count overlay */}
      <div className="absolute left-4 bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6 z-10">
        <button
          onClick={() => visiblePosts.length > 0 && setIsNearbyModalOpen(true)}
          className="glass rounded-2xl px-4 py-2 shadow-card tap-highlight-none active:scale-95 transition-transform text-left"
        >
          <p className="text-white text-xs font-semibold">이 지역 게시물</p>
          <p className="text-primary text-lg font-black leading-tight">{visiblePostCount}</p>
        </button>
      </div>

      {/* Nearby posts modal */}
      {isNearbyModalOpen && (
        <NearbyPostsModal
          posts={visiblePosts}
          onClose={() => setIsNearbyModalOpen(false)}
        />
      )}

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
