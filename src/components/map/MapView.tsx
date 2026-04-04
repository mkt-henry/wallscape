'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMapStore } from '@/stores/useMapStore'
import { useLocation } from '@/hooks/useLocation'
import { useNearbyPosts } from '@/hooks/useNearbyPosts'
import { MAP_STYLE, toLngLat } from '@/lib/maplibre'
import type { NearbyPost } from '@/types'

function createMarkerElement(imageUrl: string, isSelected: boolean): HTMLDivElement {
  const borderColor = isSelected ? '#22D3EE' : '#D946EF'
  const shadow = isSelected
    ? '0 2px 16px rgba(34, 211, 238, 0.6)'
    : '0 2px 12px rgba(217, 70, 239, 0.4)'

  const el = document.createElement('div')
  el.innerHTML = `
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
  return el
}

interface MapViewProps {
  prefetchedPosts?: NearbyPost[]
}

export function MapView({ prefetchedPosts }: MapViewProps) {
  const t = useTranslations('map')
  const tc = useTranslations('common')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const isProgrammaticMoveRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    center,
    zoom,
    selectedPost,
    setCenter,
    setZoom,
    setMapLoaded,
    setNearbyPosts,
    setVisiblePosts,
    setVisiblePostCount,
    openPostSheet,
  } = useMapStore()

  const { location } = useLocation()

  const { data: localPosts } = useNearbyPosts(center.lat, center.lng, zoom)
  const nearbyPosts = localPosts ?? prefetchedPosts

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: toLngLat(center.lat, center.lng),
        zoom,
        attributionControl: false,
      })

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

      mapInstanceRef.current = map

      map.on('load', () => {
        setIsMapLoaded(true)
        setMapLoaded(true)
      })

      map.on('error', () => {
        setLoadError(t('loadError'))
      })

      // Debounced center update
      map.on('moveend', () => {
        if (isProgrammaticMoveRef.current) return
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(() => {
          const c = map.getCenter()
          setCenter({ lat: c.lat, lng: c.lng })
        }, 500)
      })

      map.on('zoomend', () => {
        setZoom(Math.round(map.getZoom()))
      })

      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        markersRef.current.forEach((m) => m.remove())
        markersRef.current.clear()
        userMarkerRef.current?.remove()
        map.remove()
        mapInstanceRef.current = null
      }
    } catch {
      setLoadError(t('loadError'))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update map center when store changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isMapLoaded) return

    const current = map.getCenter()
    const latDiff = Math.abs(current.lat - center.lat)
    const lngDiff = Math.abs(current.lng - center.lng)
    if (latDiff < 0.0001 && lngDiff < 0.0001) return

    isProgrammaticMoveRef.current = true
    map.setCenter(toLngLat(center.lat, center.lng))
    setTimeout(() => {
      isProgrammaticMoveRef.current = false
    }, 100)
  }, [center, isMapLoaded])

  // Render post markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isMapLoaded || !nearbyPosts) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    // Add new markers
    nearbyPosts.forEach((post) => {
      const isSelected = selectedPost?.id === post.id
      const el = createMarkerElement(post.image_url, isSelected)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        openPostSheet(post)
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(toLngLat(post.lat, post.lng))
        .addTo(map)

      markersRef.current.set(post.id, marker)
    })

    setNearbyPosts(nearbyPosts)

    // Filter posts to current viewport bounds
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const inBounds = nearbyPosts.filter((post) =>
      post.lat >= sw.lat && post.lat <= ne.lat &&
      post.lng >= sw.lng && post.lng <= ne.lng
    )
    setVisiblePosts(inBounds)
    setVisiblePostCount(inBounds.length)
  }, [nearbyPosts, isMapLoaded, selectedPost?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Render user location marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isMapLoaded || !location) return

    // Remove previous user marker
    userMarkerRef.current?.remove()

    const el = document.createElement('div')
    el.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #22D3EE;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.3);
      "></div>
    `

    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(toLngLat(location.lat, location.lng))
      .addTo(map)
  }, [location, isMapLoaded])

  if (loadError) {
    return (
      <div className="w-full h-full bg-surface-2 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-error mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary tap-highlight-none"
          >
            {tc('retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full map-container"
      style={{ background: '#08080C' }}
    />
  )
}
