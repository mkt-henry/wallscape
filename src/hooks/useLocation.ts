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
        setError('Location permission denied. Please allow location access in your settings.')
        break
      case err.POSITION_UNAVAILABLE:
        setError('Location information is unavailable.')
        break
      case err.TIMEOUT:
        setError('Location request timed out.')
        break
      default:
        setError('An error occurred while retrieving location.')
    }
  }, [])

  const requestLocation = useCallback((): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setError('Geolocation is not supported by this browser.')
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
