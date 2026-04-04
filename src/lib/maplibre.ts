export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`

/** Convert app-standard (lat, lng) to MapLibre [lng, lat] order */
export function toLngLat(lat: number, lng: number): [number, number] {
  return [lng, lat]
}
