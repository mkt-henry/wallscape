'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/routing'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { MapPin, Heart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getSupabaseClient } from '@/lib/supabase/client'
import { MAP_STYLE, toLngLat } from '@/lib/maplibre'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import type { NearbyPost } from '@/types'

interface MiniMapProps {
  lat: number
  lng: number
  address?: string
  postId: string
}

function createMarkerElement(imageUrl: string, isHighlighted: boolean): HTMLDivElement {
  const borderColor = isHighlighted ? '#22D3EE' : '#D946EF'
  const shadow = isHighlighted
    ? '0 2px 16px rgba(34, 211, 238, 0.7)'
    : '0 2px 10px rgba(217, 70, 239, 0.4)'
  const size = isHighlighted ? 52 : 40

  const el = document.createElement('div')
  el.innerHTML = `<div style="
    width: ${size}px; height: ${size}px;
    border-radius: 50%; overflow: hidden;
    border: 3px solid ${borderColor};
    box-shadow: ${shadow};
    background: #13131A;
  ">
    <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;"
      onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#D946EF;display:flex;align-items:center;justify-content:center;font-size:14px;\\'>🎨</div>'"
    />
  </div>`
  return el
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}

export default function MiniMap({ lat, lng, address, postId }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState(false)
  const router = useRouter()
  const t = useTranslations('map')
  const supabase = getSupabaseClient()

  // Fetch nearby posts
  const { data: nearbyPosts = [] } = useQuery<NearbyPost[]>({
    queryKey: ['mini-map-nearby', lat, lng],
    queryFn: async () => {
      const { data, err } = await supabase.rpc('get_nearby_posts', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: 2000,
        post_limit: 20,
      }) as { data: NearbyPost[] | null; err?: unknown }
      return data ?? []
    },
    staleTime: 60_000,
  })

  // Init map
  useEffect(() => {
    if (!containerRef.current) return

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: toLngLat(lat, lng),
        zoom: 14,
        interactive: false,
        attributionControl: false,
      })

      mapRef.current = map
      map.on('load', () => setMapLoaded(true))
      map.on('error', () => setError(true))

      return () => {
        map.remove()
        mapRef.current = null
      }
    } catch {
      setError(true)
    }
  }, [lat, lng])

  // Add markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || nearbyPosts.length === 0) return

    nearbyPosts.forEach((post) => {
      const isHighlighted = post.id === postId
      const el = createMarkerElement(post.image_url, isHighlighted)

      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(toLngLat(post.lat, post.lng))
        .addTo(map)
    })
  }, [nearbyPosts, mapLoaded, postId])

  // Nearby posts excluding current (for bottom list)
  const otherPosts = nearbyPosts.filter((p) => p.id !== postId)

  if (error) {
    return (
      <div
        onClick={() => router.push(`/map?lat=${lat}&lng=${lng}&postId=${postId}`)}
        className="bg-surface-2 rounded-2xl h-40 flex items-center justify-center cursor-pointer"
      >
        <div className="text-center">
          <MapPin size={28} className="text-primary mx-auto mb-1.5" />
          <p className="text-white text-sm font-medium">{t('viewOnMap')}</p>
          {address && <p className="text-text-secondary text-xs mt-0.5">{address}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Map */}
      <div
        onClick={() => router.push(`/map?lat=${lat}&lng=${lng}&postId=${postId}`)}
        className="rounded-2xl overflow-hidden h-44 relative cursor-pointer w-full"
      >
        <div ref={containerRef} className="w-full h-full" />
        {!mapLoaded && <div className="absolute inset-0 skeleton" />}
        {/* Transparent overlay — blocks map interaction, enables click navigation */}
        <div className="absolute inset-0" />
        {address && (
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
              <MapPin size={11} className="text-primary shrink-0" />
              <span className="text-white text-xs truncate max-w-[180px]">{address}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nearby posts list */}
      {otherPosts.length > 0 && (
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">
            {t('nearbyCount', { count: otherPosts.length })}
          </p>
          <NearbyPostsScroll posts={otherPosts} />
        </div>
      )}
    </div>
  )
}

function NearbyPostsScroll({ posts }: { posts: NearbyPost[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '4px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="no-scrollbar"
    >
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/feed/${post.id}`}
          style={{ flex: '0 0 136px', width: '136px' }}
          className="tap-highlight-none group block"
        >
          <div className="relative rounded-xl overflow-hidden bg-surface-2 mb-2" style={{ width: '136px', height: '136px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 rounded-md px-1.5 py-0.5">
              <MapPin size={9} className="text-primary" />
              <span className="text-white text-[10px] font-medium">
                {formatDistance(post.distance_meters)}
              </span>
            </div>
          </div>
          <p className="text-white text-xs font-medium leading-snug line-clamp-2">
            {post.title}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Heart size={10} className="text-text-muted shrink-0" />
            <span className="text-text-muted text-[10px]">{formatNumber(post.like_count)}</span>
            <span className="text-text-muted text-[10px] ml-1">{formatRelativeTime(post.created_at)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
