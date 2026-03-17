'use client'

import { useEffect, useRef, useState } from 'react'
import { useMapStore } from '@/stores/useMapStore'
import { useLocation } from '@/hooks/useLocation'
import { useNearbyPosts } from '@/hooks/useNearbyPosts'
import type { NearbyPost } from '@/types'

import { loadKakaoScript } from '@/lib/kakao'

// Custom marker HTML for a post thumbnail
function createMarkerContent(imageUrl: string, isSelected: boolean): string {
  const borderColor = isSelected ? '#22D3EE' : '#D946EF'
  const shadow = isSelected
    ? '0 2px 16px rgba(34, 211, 238, 0.6)'
    : '0 2px 12px rgba(217, 70, 239, 0.4)'

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
      background: #13131A;
    ">
      <img
        src="${imageUrl}"
        style="width: 100%; height: 100%; object-fit: cover;"
        onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#D946EF;display:flex;align-items:center;justify-content:center;font-size:18px;\\'>🎨</div>'"
      />
    </div>
  `
}

interface KakaoMapProps {
  prefetchedPosts?: NearbyPost[]
}

export function KakaoMap({ prefetchedPosts }: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const clustererRef = useRef<unknown>(null)
  const overlaysRef = useRef<Map<string, unknown>>(new Map())
  const isProgrammaticMoveRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Use prefetched posts from parent, also fetch from map's own center on pan
  const { data: localPosts } = useNearbyPosts(center.lat, center.lng)
  const nearbyPosts = localPosts ?? prefetchedPosts

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

    // Debounced center update: wait until map stops moving for 500ms
    kakao.maps.event.addListener(map, 'center_changed', () => {
      if (isProgrammaticMoveRef.current) return
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        const c = map.getCenter()
        setCenter({ lat: c.getLat(), lng: c.getLng() })
      }, 500)
    })

    kakao.maps.event.addListener(map, 'zoom_changed', () => {
      setZoom(map.getLevel())
    })

    setMapLoaded(true)

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      mapInstanceRef.current = null
      clustererRef.current = null
    }
  }, [isKakaoLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update map center when store changes (from URL params or "my location" button)
  // Skip if the map center already matches (i.e. change came from the map itself)
  useEffect(() => {
    if (!isKakaoLoaded || !mapInstanceRef.current) return
    const kakao = window.kakao
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any
    const current = map.getCenter()

    // Only move the map if the center is meaningfully different (> ~10m)
    const latDiff = Math.abs(current.getLat() - center.lat)
    const lngDiff = Math.abs(current.getLng() - center.lng)
    if (latDiff < 0.0001 && lngDiff < 0.0001) return

    isProgrammaticMoveRef.current = true
    map.setCenter(new kakao.maps.LatLng(center.lat, center.lng))
    // Reset flag after a short delay to allow the event to fire and be ignored
    setTimeout(() => {
      isProgrammaticMoveRef.current = false
    }, 100)
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
        background: #22D3EE;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.3);
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
      style={{ background: '#08080C' }}
    />
  )
}
