'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useMapStore } from '@/stores/useMapStore'
import { useLocation } from '@/hooks/useLocation'
import type { NearbyPost } from '@/types'

import { loadKakaoScript } from '@/lib/kakao'

// Custom marker HTML for a post thumbnail
function createMarkerContent(imageUrl: string, isSelected: boolean): string {
  const borderColor = isSelected ? '#4ECDC4' : '#FF6B35'
  const shadow = isSelected
    ? '0 2px 16px rgba(78, 205, 196, 0.6)'
    : '0 2px 12px rgba(255, 107, 53, 0.4)'

  return `
    <div style="
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid ${borderColor};
      box-shadow: ${shadow};
      cursor: pointer;
      transition: transform 0.2s ease;
      background: #1A1A1A;
    ">
      <img
        src="${imageUrl}"
        style="width: 100%; height: 100%; object-fit: cover;"
        onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#FF6B35;display:flex;align-items:center;justify-content:center;font-size:18px;\\'>🎨</div>'"
      />
    </div>
  `
}

export function KakaoMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const clustererRef = useRef<unknown>(null)
  const overlaysRef = useRef<Map<string, unknown>>(new Map())

  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    center,
    zoom,
    selectedPost,
    setCenter,
    setZoom,
    setMapLoaded,
    setNearbyPosts,
    openPostSheet,
  } = useMapStore()

  const { location } = useLocation()
  const supabase = getSupabaseClient()

  // Fetch nearby posts based on current map center
  const { data: nearbyPosts } = useQuery({
    queryKey: ['nearby-posts', center.lat, center.lng],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_nearby_posts', {
        user_lat: center.lat,
        user_lng: center.lng,
        radius_meters: 5000,
        post_limit: 100,
      })

      if (error) throw error
      return (data || []) as NearbyPost[]
    },
    staleTime: 30_000,
  })

  // Load Kakao Maps SDK
  useEffect(() => {
    loadKakaoScript()
      .then(() => setIsKakaoLoaded(true))
      .catch((err) => {
        console.error('Kakao Maps load error:', err)
        setLoadError('카카오맵을 불러오지 못했습니다')
      })
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isKakaoLoaded || !mapContainerRef.current) return

    const kakao = window.kakao
    const options = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: zoom,
    }

    const map = new kakao.maps.Map(mapContainerRef.current, options)
    mapInstanceRef.current = map

    // Create clusterer
    const clusterer = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 4,
    })
    clustererRef.current = clusterer

    // Listen for map events
    kakao.maps.event.addListener(map, 'center_changed', () => {
      const newCenter = map.getCenter()
      setCenter({ lat: newCenter.getLat(), lng: newCenter.getLng() })
    })

    kakao.maps.event.addListener(map, 'zoom_changed', () => {
      setZoom(map.getLevel())
    })

    setMapLoaded(true)

    return () => {
      mapInstanceRef.current = null
      clustererRef.current = null
    }
  }, [isKakaoLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update map center when store changes (from URL params or location)
  useEffect(() => {
    if (!isKakaoLoaded || !mapInstanceRef.current) return
    const kakao = window.kakao
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any
    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng))
  }, [center, isKakaoLoaded])

  // Render post markers when posts change
  useEffect(() => {
    if (!isKakaoLoaded || !mapInstanceRef.current || !nearbyPosts) return

    const kakao = window.kakao
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any

    // Clear existing overlays
    overlaysRef.current.forEach((overlay) => {
      (overlay as any).setMap(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    })
    overlaysRef.current.clear()

    // Add new overlays
    nearbyPosts.forEach((post) => {
      const isSelected = selectedPost?.id === post.id
      const content = document.createElement('div')
      content.innerHTML = createMarkerContent(post.image_url, isSelected)
      content.onclick = () => openPostSheet(post)

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(post.lat, post.lng),
        content,
        map,
        yAnchor: 1,
        zIndex: isSelected ? 10 : 1,
      })

      overlaysRef.current.set(post.id, overlay)
    })

    setNearbyPosts(nearbyPosts)
  }, [nearbyPosts, isKakaoLoaded, selectedPost?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Render user location marker
  useEffect(() => {
    if (!isKakaoLoaded || !mapInstanceRef.current || !location) return

    const kakao = window.kakao
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any

    const content = document.createElement('div')
    content.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #4ECDC4;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(78, 205, 196, 0.3);
      "></div>
    `

    new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(location.lat, location.lng),
      content,
      map,
      zIndex: 5,
    })
  }, [location, isKakaoLoaded])

  if (loadError) {
    return (
      <div className="w-full h-full bg-surface-2 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-error mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary tap-highlight-none"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full kakao-map-container"
      style={{ background: '#0A0A0A' }}
    />
  )
}
