import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { PostWithUser, NearbyPost } from '@/types'

interface MapCenter {
  lat: number
  lng: number
}

interface MapState {
  center: MapCenter
  zoom: number
  selectedPost: PostWithUser | NearbyPost | null
  hoveredPostId: string | null
  nearbyPosts: NearbyPost[]
  isMapLoaded: boolean
  isBottomSheetOpen: boolean
  searchRadius: number // meters

  // Actions
  setCenter: (center: MapCenter) => void
  setZoom: (zoom: number) => void
  setSelectedPost: (post: PostWithUser | NearbyPost | null) => void
  setHoveredPostId: (id: string | null) => void
  setNearbyPosts: (posts: NearbyPost[]) => void
  setMapLoaded: (loaded: boolean) => void
  setBottomSheetOpen: (open: boolean) => void
  setSearchRadius: (radius: number) => void
  openPostSheet: (post: PostWithUser | NearbyPost) => void
  closePostSheet: () => void
  resetMap: () => void
}

const DEFAULT_CENTER: MapCenter = {
  lat: 37.5665, // Seoul City Hall
  lng: 126.978,
}

const initialState = {
  center: DEFAULT_CENTER,
  zoom: 5,
  selectedPost: null,
  hoveredPostId: null,
  nearbyPosts: [],
  isMapLoaded: false,
  isBottomSheetOpen: false,
  searchRadius: 2000, // 2km default
}

export const useMapStore = create<MapState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCenter: (center) => set({ center }, false, 'setCenter'),

      setZoom: (zoom) => set({ zoom }, false, 'setZoom'),

      setSelectedPost: (selectedPost) =>
        set({ selectedPost }, false, 'setSelectedPost'),

      setHoveredPostId: (hoveredPostId) =>
        set({ hoveredPostId }, false, 'setHoveredPostId'),

      setNearbyPosts: (nearbyPosts) =>
        set({ nearbyPosts }, false, 'setNearbyPosts'),

      setMapLoaded: (isMapLoaded) =>
        set({ isMapLoaded }, false, 'setMapLoaded'),

      setBottomSheetOpen: (isBottomSheetOpen) =>
        set({ isBottomSheetOpen }, false, 'setBottomSheetOpen'),

      setSearchRadius: (searchRadius) =>
        set({ searchRadius }, false, 'setSearchRadius'),

      openPostSheet: (post) =>
        set(
          {
            selectedPost: post,
            isBottomSheetOpen: true,
            center: { lat: post.lat, lng: post.lng },
          },
          false,
          'openPostSheet'
        ),

      closePostSheet: () =>
        set(
          {
            isBottomSheetOpen: false,
            selectedPost: null,
          },
          false,
          'closePostSheet'
        ),

      resetMap: () => set(initialState, false, 'resetMap'),
    }),
    { name: 'MapStore' }
  )
)

// Selectors
export const selectCenter = (state: MapState) => state.center
export const selectSelectedPost = (state: MapState) => state.selectedPost
export const selectNearbyPosts = (state: MapState) => state.nearbyPosts
export const selectIsBottomSheetOpen = (state: MapState) =>
  state.isBottomSheetOpen
