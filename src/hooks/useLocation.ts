'use client'

import { useState, useCallback, useEffect } from 'react'

interface GeoLocation {
  lat: number
  lng: number
  accuracy?: number
}

interface UseLocationReturn {
  location: GeoLocation | null
  error: string | null
  isLoading: boolean
  isPermissionDenied: boolean
  requestLocation: () => Promise<GeoLocation | null>
  watchLocation: () => () => void
}

const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // 1 minute cache
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords
    setLocation({ lat: latitude, lng: longitude, accuracy })
    setError(null)
    setIsLoading(false)
    setIsPermissionDenied(false)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    setIsLoading(false)

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setIsPermissionDenied(true)
        setError('위치 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.')
        break
      case err.POSITION_UNAVAILABLE:
        setError('위치 정보를 가져올 수 없습니다.')
        break
      case err.TIMEOUT:
        setError('위치 요청 시간이 초과되었습니다.')
        break
      default:
        setError('위치를 가져오는 중 오류가 발생했습니다.')
    }
  }, [])

  const requestLocation = useCallback((): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setError('이 브라우저는 위치 기능을 지원하지 않습니다.')
        resolve(null)
        return
      }

      setIsLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleSuccess(position)
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (err) => {
          handleError(err)
          resolve(null)
        },
        LOCATION_OPTIONS
      )
    })
  }, [handleSuccess, handleError])

  const watchLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return () => {}
    }

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      LOCATION_OPTIONS
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [handleSuccess, handleError])

  // Check permission status on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            // Auto-fetch location if already permitted
            requestLocation()
          } else if (permissionStatus.state === 'denied') {
            setIsPermissionDenied(true)
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') {
              requestLocation()
              setIsPermissionDenied(false)
            } else if (permissionStatus.state === 'denied') {
              setIsPermissionDenied(true)
            }
          }
        })
        .catch(() => {
          // Permissions API not available, silent fail
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    location,
    error,
    isLoading,
    isPermissionDenied,
    requestLocation,
    watchLocation,
  }
}
