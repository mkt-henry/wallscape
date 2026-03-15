export const KAKAO_MAP_CDN = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}&libraries=clusterer&autoload=false`

export function loadKakaoScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'))

    // Already loaded
    if (window.kakao?.maps) {
      resolve()
      return
    }

    // Script already injected, wait for load
    const existing = document.querySelector(`script[src*="dapi.kakao.com"]`)
    if (existing) {
      existing.addEventListener('load', () => {
        window.kakao.maps.load(() => resolve())
      })
      return
    }

    const script = document.createElement('script')
    script.src = KAKAO_MAP_CDN
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => resolve())
    }
    script.onerror = () => reject(new Error('Kakao Maps script failed to load'))
    document.head.appendChild(script)
  })
}
