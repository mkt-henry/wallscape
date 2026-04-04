// ============================================================
// Core domain types for Wallscape
// ============================================================

export interface Location {
  lat: number
  lng: number
  address?: string
  city?: string
  district?: string
}

// ---- User & Profile ----------------------------------------

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  instagram_handle?: string | null
  location: string | null
  post_count: number
  follower_count: number
  following_count: number
  preferred_locale?: string
  created_at: string
  updated_at: string
}

export interface ProfileWithFollow extends Profile {
  is_following: boolean
  is_follower: boolean
}

export interface VerifiedArtist extends Profile {
  is_verified: boolean
}

// ---- Community / Board -------------------------------------

export type BoardCategory = 'general' | 'question' | 'meetup' | 'tips' | 'showcase'

export interface BoardPost {
  id: string
  user_id: string
  title: string
  content: string
  category: BoardCategory
  image_url: string | null
  like_count: number
  comment_count: number
  view_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface BoardPostWithUser extends BoardPost {
  profiles: Profile
}

export interface BoardComment {
  id: string
  board_post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface BoardCommentWithUser extends BoardComment {
  profiles: Profile
}

// ---- Graffiti News -----------------------------------------

export interface GraffitiNews {
  id: string
  user_id: string
  title: string
  content: string
  thumbnail_url: string | null
  view_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface GraffitiNewsWithUser extends GraffitiNews {
  profiles: Profile
}

// ---- Post --------------------------------------------------

export type PostVisibility = 'public' | 'followers' | 'private'
export type PostStatus = 'public' | 'archived'

export interface Post {
  id: string
  user_id: string
  image_url: string
  thumbnail_url: string | null
  title: string
  description: string | null
  tags: string[]
  lat: number
  lng: number
  address: string | null
  city: string | null
  district: string | null
  like_count: number
  comment_count: number
  bookmark_count: number
  view_count: number
  visibility: PostVisibility
  show_in_profile: boolean
  show_in_feed: boolean
  show_in_map: boolean
  photo_taken_at: string | null
  still_there_count: number
  gone_count: number
  last_confirmed_at: string | null
  last_report_status: 'still_there' | 'gone' | null
  tagged_artist_ids: string[]
  status: PostStatus
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface PostWithUser extends Post {
  profiles: Profile
  is_liked: boolean
  is_bookmarked: boolean
}

export interface NearbyPost extends PostWithUser {
  distance_meters: number
}

// ---- Comment -----------------------------------------------

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  like_count: number
  created_at: string
  updated_at: string
}

export interface CommentWithUser extends Comment {
  profiles: Profile
  is_liked: boolean
  replies?: CommentWithUser[]
}

// ---- Social ------------------------------------------------

export interface Like {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// ---- Notification ------------------------------------------

export type NotificationType =
  | 'like_post'
  | 'like_comment'
  | 'comment'
  | 'reply'
  | 'follow'
  | 'mention'
  | 'nearby_post'

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  message: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationWithActor extends Notification {
  actor: Profile
  post?: Pick<Post, 'id' | 'image_url' | 'title'>
}

// ---- Feed --------------------------------------------------

export type FeedSortType = 'latest' | 'popular' | 'nearby' | 'following'

export interface FeedParams {
  sort: FeedSortType
  lat?: number
  lng?: number
  radius?: number // meters
  cursor?: string
  limit?: number
  tags?: string[]
  city?: string
}

// ---- Upload ------------------------------------------------

export interface UploadFormData {
  image: File
  title: string
  description: string
  tags: string[]
  location: Location
  showInProfile: boolean
  showInFeed: boolean
  showInMap: boolean
  photoTakenAt: string | null
}

// ---- Status Report -------------------------------------------

export type StatusReportType = 'still_there' | 'gone'

export interface StatusReport {
  id: string
  post_id: string
  user_id: string
  status: StatusReportType
  created_at: string
}

export interface StatusReportWithUser extends StatusReport {
  profiles: Profile
}

// ---- Search ------------------------------------------------

export type SearchType = 'posts' | 'users' | 'tags' | 'locations'

export interface SearchResult {
  posts: PostWithUser[]
  users: Profile[]
  tags: TagResult[]
}

export interface TagResult {
  tag: string
  post_count: number
}

// ---- API ---------------------------------------------------

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

// ---- Map ---------------------------------------------------

export interface MapState {
  center: { lat: number; lng: number }
  zoom: number
  bounds?: {
    sw: { lat: number; lng: number }
    ne: { lat: number; lng: number }
  }
}

