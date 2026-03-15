'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MapPin, Search, Navigation, X, Check } from 'lucide-react'
import { useLocation } from '@/hooks/useLocation'
import { debounce, cn } from '@/lib/utils'
import type { Location } from '@/types'

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void
  initialLocation?: Location | null
}

interface AddressResult {
  address_name: string
  road_address_name?: string
  x: string // lng
  y: string // lat
}

async function searchAddress(query: string): Promise<AddressResult[]> {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  if (!appKey) return []

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
      {
        headers: { Authorization: `KakaoAK ${appKey}` },
      }
    )
    const data = await res.json()
    return data.documents || []
  } catch {
    return []
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
    const data = await res.json()
    return data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AddressResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null)
  const [manualMode, setManualMode] = useState(false)
  const [manualAddress, setManualAddress] = useState('')

  const { location: gpsLocation, requestLocation, isLoading: gpsLoading } = useLocation()

  const debouncedSearch = useCallback(
    debounce(async (query: unknown) => {
      const q = query as string
      if (!q || q.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      const results = await searchAddress(q)
      setSearchResults(results)
      setIsSearching(false)
    }, 500),
    []
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleResultSelect = async (result: AddressResult) => {
    const lat = parseFloat(result.y)
    const lng = parseFloat(result.x)
    const address = result.road_address_name || result.address_name
    const { city, district } = extractLocation(address)

    const location: Location = {
      lat,
      lng,
      address,
      city,
      district,
    }

    setSelectedLocation(location)
    onLocationSelect(location)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleUseMyLocation = async () => {
    if (!gpsLocation) {
      await requestLocation()
      return
    }

    const address = await reverseGeocode(gpsLocation.lat, gpsLocation.lng)
    const { city, district } = extractLocation(address)
    const location: Location = {
      lat: gpsLocation.lat,
      lng: gpsLocation.lng,
      address,
      city,
      district,
    }

    setSelectedLocation(location)
    onLocationSelect(location)
  }

  // Auto-reverse-geocode when initial location (from EXIF) has no address
  useEffect(() => {
    if (
      initialLocation &&
      !initialLocation.address &&
      Number.isFinite(initialLocation.lat) &&
      Number.isFinite(initialLocation.lng)
    ) {
      reverseGeocode(initialLocation.lat, initialLocation.lng).then((address) => {
        const { city, district } = extractLocation(address)
        const enriched: Location = { ...initialLocation, address, city, district }
        setSelectedLocation(enriched)
        onLocationSelect(enriched)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gpsLocation && !selectedLocation) {
      handleUseMyLocation()
    }
  }, [gpsLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSave = () => {
    if (!manualAddress.trim()) return

    // Use Seoul as fallback coordinates if no GPS
    const location: Location = {
      lat: selectedLocation?.lat ?? 37.5665,
      lng: selectedLocation?.lng ?? 126.978,
      address: manualAddress.trim(),
      city: extractLocation(manualAddress).city,
    }

    setSelectedLocation(location)
    onLocationSelect(location)
    setManualMode(false)
  }

  return (
    <div className="space-y-4 px-4">
      {/* Selected location display */}
      {selectedLocation && (
        <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-primary text-xs font-semibold mb-0.5">선택된 위치</p>
            <p className="text-white text-sm font-medium line-clamp-2">
              {selectedLocation.address || `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedLocation(null)
              onLocationSelect(null as unknown as Location)
            }}
            className="p-1 tap-highlight-none"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-surface-2 rounded-2xl px-4 py-3 border border-border focus-within:border-primary transition-colors">
          <Search size={18} className="text-text-secondary shrink-0" />
          <input
            type="text"
            placeholder="주소나 장소를 검색하세요"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-text-muted outline-none"
          />
          {isSearching && <div className="loader shrink-0" style={{ width: 16, height: 16 }} />}
          {searchQuery && !isSearching && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} className="tap-highlight-none">
              <X size={16} className="text-text-secondary" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl overflow-hidden shadow-card z-10">
            {searchResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleResultSelect(result)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-2 transition-colors tap-highlight-none border-b border-border/30 last:border-0"
              >
                <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {result.road_address_name || result.address_name}
                  </p>
                  {result.road_address_name && result.address_name !== result.road_address_name && (
                    <p className="text-text-secondary text-xs truncate mt-0.5">
                      {result.address_name}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {/* Use my location */}
        <button
          onClick={handleUseMyLocation}
          disabled={gpsLoading}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all tap-highlight-none',
            gpsLocation
              ? 'bg-secondary/10 border-secondary/30 text-secondary'
              : 'bg-surface-2 border-border text-text-secondary hover:border-border-light'
          )}
        >
          {gpsLoading ? (
            <div className="loader" />
          ) : (
            <Navigation size={22} className={gpsLocation ? 'text-secondary' : 'text-text-secondary'} />
          )}
          <span className="text-sm font-medium">
            {gpsLoading ? '위치 가져오는 중...' : '내 위치 사용'}
          </span>
        </button>

        {/* Manual input */}
        <button
          onClick={() => setManualMode(!manualMode)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all tap-highlight-none',
            manualMode
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-surface-2 border-border text-text-secondary hover:border-border-light'
          )}
        >
          <MapPin size={22} />
          <span className="text-sm font-medium">직접 입력</span>
        </button>
      </div>

      {/* Manual address input */}
      {manualMode && (
        <div className="space-y-3 p-4 bg-surface-2 rounded-2xl border border-border animate-fade-in">
          <label className="text-text-secondary text-xs font-semibold uppercase tracking-wide">
            주소 직접 입력
          </label>
          <input
            type="text"
            placeholder="예: 서울특별시 마포구 홍익로 94"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="input-base"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setManualMode(false)}
              className="flex-1 py-2.5 rounded-xl bg-surface-3 text-text-secondary text-sm font-medium tap-highlight-none"
            >
              취소
            </button>
            <button
              onClick={handleManualSave}
              disabled={!manualAddress.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold tap-highlight-none disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              확인
            </button>
          </div>
        </div>
      )}

      {/* Info text */}
      {!selectedLocation && (
        <p className="text-text-muted text-xs text-center px-4">
          정확한 위치를 지정하면 주변 아티스트들이 작품을 발견할 수 있어요
        </p>
      )}
    </div>
  )
}

function extractLocation(address: string): { city: string; district: string } {
  // Korean address: "서울특별시 마포구 홍익로 94" or "서울 강남구 삼성동 166"
  const parts = address.split(' ').filter(Boolean)
  const city = parts[0] || ''
  const district = parts.find((p) => /[구군]$/.test(p)) || parts[1] || ''
  // Don't save if it looks like coordinates
  if (/^\d/.test(city)) return { city: '', district: '' }
  return { city, district }
}
