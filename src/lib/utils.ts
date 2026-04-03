import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ---- Tailwind class merging --------------------------------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---- Anonymous profile (비공개 프로필) -------------------------

import type { Profile } from '@/types'

// A~Z 중 W 제외 (25개), 각 알파벳에 대응하는 익명 이름
export const ANON_NAMES: Record<string, string> = {
  A: 'Alex', B: 'Blake', C: 'Charlie', D: 'Dana',
  E: 'Ellis', F: 'Frankie', G: 'Gray', H: 'Harper',
  I: 'Indigo', J: 'Jesse', K: 'Kai', L: 'Lane',
  M: 'Morgan', N: 'Noel', O: 'Oakley', P: 'Parker',
  Q: 'Quinn', R: 'Riley', S: 'Sage', T: 'Taylor',
  U: 'Uri', V: 'Val', X: 'Xander', Y: 'Yuri', Z: 'Zen',
}
const ANON_LETTERS = Object.keys(ANON_NAMES)

/**
 * postId를 기반으로 고정된 익명 알파벳을 결정
 */
function getAnonLetter(postId: string): string {
  let hash = 0
  for (let i = 0; i < postId.length; i++) {
    hash = ((hash << 5) - hash + postId.charCodeAt(i)) | 0
  }
  return ANON_LETTERS[Math.abs(hash) % ANON_LETTERS.length]
}

/**
 * show_in_profile이 false이고 본인이 아니면 익명 프로필 반환.
 * 포스트별로 고정된 A~Z(W 제외) 알파벳이 배정됨.
 * 이미지: /anonymous/a.png ~ /anonymous/z.png (w 제외)
 */
export function getDisplayProfile(
  profiles: Profile,
  showInProfile: boolean,
  viewerUserId?: string,
  postUserId?: string,
  postId?: string,
): { profile: Profile; isAnonymous: boolean; letter: string } {
  if (showInProfile || (viewerUserId && viewerUserId === postUserId)) {
    return { profile: profiles, isAnonymous: false, letter: '' }
  }
  const letter = getAnonLetter(postId ?? '')
  return {
    profile: {
      id: 'anonymous',
      username: `anonymous-${letter.toLowerCase()}`,
      display_name: ANON_NAMES[letter],
      avatar_url: `/anonymous/${letter.toLowerCase()}.png`,
      bio: null,
      website: null,
      location: null,
      post_count: 0,
      follower_count: 0,
      following_count: 0,
      created_at: '',
      updated_at: '',
    },
    isAnonymous: true,
    letter,
  }
}

// ---- Date formatting ----------------------------------------

const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' },
]

export function formatRelativeTime(dateStr: string, locale: string = 'ko'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const date = new Date(dateStr)
  let duration = (date.getTime() - new Date().getTime()) / 1000

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }

  return rtf.format(Math.round(duration), 'years')
}

export function formatDate(dateStr: string, locale: string = 'ko-KR'): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(dateStr: string, locale: string = 'ko-KR'): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// ---- Number formatting --------------------------------------

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

// ---- Distance formatting ------------------------------------

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// ---- EXIF extraction (GPS + date) ---------------------------

export interface ExifLocation {
  lat: number
  lng: number
}

export interface ExifData {
  location: ExifLocation | null
  takenAt: string | null // ISO date string
}

export async function extractExifData(
  file: File
): Promise<ExifData> {
  const result: ExifData = { location: null, takenAt: null }
  try {
    const exifrModule = await import('exifr')
    const exifr = exifrModule.default || exifrModule
    const buffer = await file.arrayBuffer()

    // Extract date
    try {
      const dateTags = await exifr.parse(buffer, {
        pick: ['DateTimeOriginal', 'CreateDate', 'DateTimeDigitized', 'GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef'],
      })
      const dateValue = dateTags?.DateTimeOriginal || dateTags?.CreateDate || dateTags?.DateTimeDigitized
      if (dateValue instanceof Date) {
        result.takenAt = dateValue.toISOString()
      } else if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue)
        if (!isNaN(parsed.getTime())) result.takenAt = parsed.toISOString()
      }

      // Also try GPS from same parse
      if (dateTags?.GPSLatitude && dateTags?.GPSLongitude) {
        const lat = dmsToDecimal(dateTags.GPSLatitude, dateTags.GPSLatitudeRef)
        const lng = dmsToDecimal(dateTags.GPSLongitude, dateTags.GPSLongitudeRef)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          result.location = { lat, lng }
        }
      }
    } catch {
      // parse failed
    }

    // If no GPS yet, try exifr.gps()
    if (!result.location) {
      try {
        const gps = await exifr.gps(buffer)
        if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
          result.location = { lat: gps.latitude, lng: gps.longitude }
        }
      } catch {
        // gps() failed
      }
    }

    return result
  } catch (error) {
    console.warn('EXIF extraction failed:', error)
    return result
  }
}

/** @deprecated Use extractExifData instead */
export async function extractExifLocation(
  file: File
): Promise<ExifLocation | null> {
  const { location } = await extractExifData(file)
  return location
}

/** Convert GPS DMS (degrees/minutes/seconds) array to decimal degrees */
function dmsToDecimal(
  dms: number | number[],
  ref?: string
): number {
  let decimal: number
  if (typeof dms === 'number') {
    decimal = dms
  } else if (Array.isArray(dms)) {
    const [d = 0, m = 0, s = 0] = dms
    decimal = d + m / 60 + s / 3600
  } else {
    return NaN
  }
  if (ref === 'S' || ref === 'W') decimal = -decimal
  return decimal
}

// ---- Image utilities ----------------------------------------

export function createObjectURL(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url)
}

export async function resizeImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = createObjectURL(file)

    img.onload = () => {
      revokeObjectURL(url)

      let { width, height } = img

      // Always downscale to fit maxWidth/maxHeight
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)

      // Hard cap for canvas safety (some browsers fail silently above ~16MP)
      const MAX_CANVAS_PX = 4096
      if (width > MAX_CANVAS_PX || height > MAX_CANVAS_PX) {
        const cap = Math.min(MAX_CANVAS_PX / width, MAX_CANVAS_PX / height)
        width = Math.round(width * cap)
        height = Math.round(height * cap)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Image conversion failed. Please try a different image.'))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = reject
    img.src = url
  })
}

// ---- Validation helpers -------------------------------------

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

// ---- URL / Storage helpers ----------------------------------

export function getPublicStorageUrl(
  bucket: string,
  path: string
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export function generateStoragePath(
  userId: string,
  fileName: string
): string {
  const ext = fileName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${userId}/${timestamp}-${random}.${ext}`
}

// ---- Hashtag utilities --------------------------------------

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w가-힣]+/g) || []
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))]
}

export function parseTagsFromString(tagsStr: string): string[] {
  return tagsStr
    .split(/[\s,]+/)
    .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 30)
}

// ---- Geolocation helpers ------------------------------------

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // distance in meters
}

// ---- Debounce -----------------------------------------------

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ---- Color utilities ----------------------------------------

export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}
