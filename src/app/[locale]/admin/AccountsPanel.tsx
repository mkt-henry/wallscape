'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  UserPlus,
  Trash2,
  RefreshCw,
  Upload,
  X,
  MapPin,
  Image as ImageIcon,
  Users,
  Pencil,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { extractExifLocation } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────
interface FakeAccount {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  post_count: number
  created_at: string
}

interface AccountPost {
  id: string
  title: string
  description: string | null
  tags: string[]
  image_url: string
  lat: number
  lng: number
  address: string | null
  city: string | null
  district: string | null
  visibility: string
  like_count: number
  comment_count: number
  created_at: string
}

// ── Component ────────────────────────────────────────────────
export default function AccountsPanel() {
  const [accounts, setAccounts] = useState<FakeAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Create account form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createUsername, setCreateUsername] = useState('')
  const [createDisplayName, setCreateDisplayName] = useState('')
  const [createBio, setCreateBio] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Upload form
  const [uploadAccountId, setUploadAccountId] = useState<string | null>(null)
  const [uploadImage, setUploadImage] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadLat, setUploadLat] = useState('')
  const [uploadLng, setUploadLng] = useState('')
  const [uploadAddress, setUploadAddress] = useState('')
  const [uploadCity, setUploadCity] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // Expanded account (to show posts)
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [accountPosts, setAccountPosts] = useState<AccountPost[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  // Edit profile
  const [editingAccount, setEditingAccount] = useState<FakeAccount | null>(null)
  const [editProfileUsername, setEditProfileUsername] = useState('')
  const [editProfileDisplayName, setEditProfileDisplayName] = useState('')
  const [editProfileBio, setEditProfileBio] = useState('')
  const [editProfileAvatar, setEditProfileAvatar] = useState<File | null>(null)
  const [editProfileAvatarPreview, setEditProfileAvatarPreview] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [editProfileError, setEditProfileError] = useState('')
  const profileAvatarInputRef = useRef<HTMLInputElement>(null)

  // Edit post
  const [editingPost, setEditingPost] = useState<AccountPost | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editVisibility, setEditVisibility] = useState('')
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/accounts')
      if (!res.ok) {
        let msg = `서버 오류 (${res.status})`
        try { const body = await res.json(); msg = body.error || msg } catch {}
        throw new Error(msg)
      }
      const text = await res.text()
      let data: { accounts: FakeAccount[] }
      try { data = JSON.parse(text) } catch { throw new Error('서버 응답을 파싱할 수 없습니다. 잠시 후 다시 시도해주세요.') }
      setAccounts(data.accounts)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // ── Fetch posts for an account ──
  const fetchAccountPosts = useCallback(async (accountId: string) => {
    setIsLoadingPosts(true)
    try {
      const res = await fetch(`/api/admin/accounts/upload?user_id=${accountId}`)
      if (!res.ok) throw new Error('게시물 불러오기 실패')
      const data = await res.json()
      setAccountPosts(data.posts)
    } catch {
      setAccountPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }, [])

  const toggleExpand = (accountId: string) => {
    if (expandedAccountId === accountId) {
      setExpandedAccountId(null)
      setAccountPosts([])
    } else {
      setExpandedAccountId(accountId)
      fetchAccountPosts(accountId)
    }
  }

  // ── Create account ──
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createUsername,
          display_name: createDisplayName || createUsername,
          bio: createBio || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '계정 생성 실패')
      setAccounts((prev) => [data.account, ...prev])
      setShowCreateForm(false)
      setCreateUsername('')
      setCreateDisplayName('')
      setCreateBio('')
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Delete account ──
  const handleDeleteAccount = async (id: string) => {
    if (!confirm('이 가계정과 관련된 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) return
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '삭제 실패')
      }
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      if (expandedAccountId === id) setExpandedAccountId(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    }
  }

  // ── Edit profile ──
  const openEditProfile = (account: FakeAccount) => {
    setEditingAccount(account)
    setEditProfileUsername(account.username)
    setEditProfileDisplayName(account.display_name || '')
    setEditProfileBio(account.bio || '')
    setEditProfileAvatar(null)
    setEditProfileAvatarPreview(null)
    setEditProfileError('')
  }

  const closeEditProfile = () => {
    setEditingAccount(null)
    setEditProfileAvatar(null)
    setEditProfileAvatarPreview(null)
    setEditProfileError('')
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return
    setIsSavingProfile(true)
    setEditProfileError('')
    try {
      const formData = new FormData()
      formData.append('id', editingAccount.id)
      formData.append('username', editProfileUsername)
      formData.append('display_name', editProfileDisplayName)
      formData.append('bio', editProfileBio)
      if (editProfileAvatar) {
        formData.append('avatar', editProfileAvatar)
      }

      const res = await fetch('/api/admin/accounts', { method: 'PATCH', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '수정 실패')
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingAccount.id ? { ...a, ...data.account } : a))
      )
      closeEditProfile()
    } catch (e: unknown) {
      setEditProfileError(e instanceof Error ? e.message : '수정에 실패했습니다.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // ── Upload ──
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      if (!res.ok) return null
      const data = await res.json()
      return data as { address: string; city: string; district: string }
    } catch {
      return null
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadImage(file)
    setUploadPreview(URL.createObjectURL(file))
    // Auto-extract EXIF location + reverse geocode for address & city
    const exif = await extractExifLocation(file)
    if (exif) {
      setUploadLat(String(exif.lat))
      setUploadLng(String(exif.lng))
      const geo = await reverseGeocode(exif.lat, exif.lng)
      if (geo) {
        setUploadAddress(geo.address || '')
        setUploadCity(geo.city || geo.district || '')
      }
    }
  }

  const resetUploadForm = () => {
    setUploadAccountId(null)
    setUploadImage(null)
    setUploadPreview(null)
    setUploadTitle('')
    setUploadDescription('')
    setUploadTags('')
    setUploadLat('')
    setUploadLng('')
    setUploadAddress('')
    setUploadCity('')
    setUploadError('')
    setUploadSuccess('')
  }

  const handleUploadPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadAccountId || !uploadImage || !uploadTitle) return
    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const formData = new FormData()
      formData.append('user_id', uploadAccountId)
      formData.append('image', uploadImage)
      formData.append('title', uploadTitle)
      formData.append('description', uploadDescription)
      formData.append('tags', JSON.stringify(
        uploadTags.split(/[,\s#]+/).map((t) => t.trim()).filter(Boolean)
      ))
      formData.append('lat', uploadLat || '37.5665')
      formData.append('lng', uploadLng || '126.9780')
      formData.append('address', uploadAddress)
      formData.append('city', uploadCity || '')
      formData.append('visibility', 'public')

      const res = await fetch('/api/admin/accounts/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '업로드 실패')
      setUploadSuccess('게시물이 생성되었습니다!')
      setUploadImage(null)
      setUploadPreview(null)
      setUploadTitle('')
      setUploadDescription('')
      setUploadTags('')
      fetchAccounts()
      if (expandedAccountId === uploadAccountId) fetchAccountPosts(uploadAccountId)
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Edit post ──
  const openEditModal = async (post: AccountPost) => {
    setEditingPost(post)
    setEditTitle(post.title)
    setEditDescription(post.description || '')
    setEditTags(post.tags?.join(', ') || '')
    setEditLat(String(post.lat))
    setEditLng(String(post.lng))
    setEditAddress(post.address || '')
    setEditCity(post.city || '')
    setEditVisibility(post.visibility)
    setEditImage(null)
    setEditImagePreview(null)
    setEditError('')

    // Auto-fill address if lat/lng exist but address is empty
    if (post.lat && post.lng && !post.address) {
      const geo = await reverseGeocode(post.lat, post.lng)
      if (geo) {
        setEditAddress(geo.address || '')
        setEditCity(geo.city || geo.district || '')
      }
    }
  }

  const closeEditModal = () => {
    setEditingPost(null)
    setEditImage(null)
    setEditImagePreview(null)
    setEditError('')
  }

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImage(file)
    setEditImagePreview(URL.createObjectURL(file))
    // Auto-extract EXIF location + reverse geocode for address & city
    const exif = await extractExifLocation(file)
    if (exif) {
      setEditLat(String(exif.lat))
      setEditLng(String(exif.lng))
      const geo = await reverseGeocode(exif.lat, exif.lng)
      if (geo) {
        setEditAddress(geo.address || '')
        setEditCity(geo.city || geo.district || '')
      }
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPost) return
    setIsSavingEdit(true)
    setEditError('')
    try {
      const formData = new FormData()
      formData.append('post_id', editingPost.id)
      formData.append('title', editTitle)
      formData.append('description', editDescription)
      formData.append('tags', JSON.stringify(
        editTags.split(/[,\s#]+/).map((t) => t.trim()).filter(Boolean)
      ))
      formData.append('lat', editLat)
      formData.append('lng', editLng)
      formData.append('address', editAddress)
      formData.append('city', editCity)
      formData.append('visibility', editVisibility)
      if (editImage) {
        formData.append('image', editImage)
      }

      const res = await fetch('/api/admin/accounts/upload', {
        method: 'PATCH',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '수정 실패')
      setAccountPosts((prev) =>
        prev.map((p) => (p.id === editingPost.id ? { ...p, ...data.post } : p))
      )
      closeEditModal()
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : '수정에 실패했습니다.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ── Delete post ──
  const handleDeletePost = async (postId: string) => {
    if (!confirm('이 게시물을 삭제하시겠습니까?')) return
    try {
      const res = await fetch('/api/admin/accounts/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })
      if (!res.ok) throw new Error('삭제 실패')
      setAccountPosts((prev) => prev.filter((p) => p.id !== postId))
      fetchAccounts()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    }
  }

  const uploadAccount = accounts.find((a) => a.id === uploadAccountId)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">가계정 관리</h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAccounts}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-text-secondary hover:text-white text-xs transition-colors disabled:opacity-50 tap-highlight-none"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
          <Button size="sm" onClick={() => setShowCreateForm(true)} leftIcon={<UserPlus size={14} />}>
            <span className="hidden sm:inline">가계정 만들기</span>
            <span className="sm:hidden">추가</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-text-secondary text-xs">총 가계정</span>
          <span className="text-2xl font-black text-white">{accounts.length}</span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-white/5 flex flex-col gap-1">
          <span className="text-text-secondary text-xs">총 게시물</span>
          <span className="text-2xl font-black text-white">
            {accounts.reduce((sum, a) => sum + (a.post_count || 0), 0)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-2xl px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* ── Create account modal ────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-md p-5 sm:p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">새 가계정</h3>
              <button onClick={() => { setShowCreateForm(false); setCreateError('') }} className="p-1 text-text-secondary hover:text-white tap-highlight-none">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <Input label="사용자명 *" type="text" placeholder="username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} required />
              <Input label="표시 이름" type="text" placeholder="표시될 이름" value={createDisplayName} onChange={(e) => setCreateDisplayName(e.target.value)} />
              <div>
                <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">자기소개</label>
                <textarea placeholder="한 줄 소개" value={createBio} onChange={(e) => setCreateBio(e.target.value)} rows={2} className="input-base resize-none" />
              </div>
              {createError && <div className="bg-error/10 border border-error/20 rounded-xl px-3 py-2 text-error text-sm">{createError}</div>}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" fullWidth onClick={() => { setShowCreateForm(false); setCreateError('') }} type="button">취소</Button>
                <Button fullWidth type="submit" isLoading={isCreating} disabled={!createUsername}>생성</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload post modal ───────────────────────── */}
      {uploadAccountId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-lg p-5 sm:p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={uploadAccount?.avatar_url ?? null} username={uploadAccount?.username || ''} size="sm" />
                <div>
                  <h3 className="text-white font-bold text-lg">게시물 업로드</h3>
                  <p className="text-text-secondary text-xs">@{uploadAccount?.username} 계정으로 업로드</p>
                </div>
              </div>
              <button onClick={resetUploadForm} className="p-1 text-text-secondary hover:text-white tap-highlight-none"><X size={20} /></button>
            </div>
            <form onSubmit={handleUploadPost} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">이미지 *</label>
                {uploadPreview ? (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadPreview} alt="Preview" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => { setUploadImage(null); setUploadPreview(null) }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white tap-highlight-none"><X size={16} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-36 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-surface-2 flex flex-col items-center justify-center gap-2 transition-colors tap-highlight-none">
                    <ImageIcon size={28} className="text-text-muted" />
                    <span className="text-text-secondary text-sm">이미지를 선택하세요</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
              <Input label="제목 *" type="text" placeholder="작품 제목" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required maxLength={60} />
              <div>
                <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">설명</label>
                <textarea placeholder="작품에 대한 설명" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} maxLength={500} rows={2} className="input-base resize-none" />
              </div>
              <Input label="태그" type="text" placeholder="#graffiti #streetart" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} hint="쉼표나 공백으로 구분" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-text-secondary text-xs font-semibold uppercase tracking-wide">위치 정보</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="위도" type="text" placeholder="37.5665" value={uploadLat} onChange={(e) => setUploadLat(e.target.value)} />
                  <Input label="경도" type="text" placeholder="126.9780" value={uploadLng} onChange={(e) => setUploadLng(e.target.value)} />
                </div>
                <Input label="주소" type="text" placeholder="서울특별시 중구 ..." value={uploadAddress} onChange={(e) => setUploadAddress(e.target.value)} />
              </div>
              {uploadError && <div className="bg-error/10 border border-error/20 rounded-xl px-3 py-2 text-error text-sm">{uploadError}</div>}
              {uploadSuccess && <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 text-green-400 text-sm">{uploadSuccess}</div>}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" fullWidth onClick={resetUploadForm} type="button">닫기</Button>
                <Button fullWidth type="submit" isLoading={isUploading} disabled={!uploadImage || !uploadTitle} leftIcon={<Upload size={16} />}>업로드</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit post modal ─────────────────────────── */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-lg p-5 sm:p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">게시물 수정</h3>
              <button onClick={closeEditModal} className="p-1 text-text-secondary hover:text-white tap-highlight-none"><X size={20} /></button>
            </div>

            {/* Image — click to replace */}
            <div
              className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-2 cursor-pointer group"
              onClick={() => editFileInputRef.current?.click()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editImagePreview || editingPost.image_url}
                alt={editingPost.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  이미지 변경
                </span>
              </div>
              {editImagePreview && (
                <div className="absolute top-2 right-2 bg-primary rounded-full px-2 py-0.5 text-xs text-white font-medium">
                  새 이미지
                </div>
              )}
            </div>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleEditImageSelect}
              className="hidden"
            />

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input label="제목 *" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required maxLength={60} />
              <div>
                <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">설명</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={500} rows={2} className="input-base resize-none" />
              </div>
              <Input label="태그" type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} hint="쉼표나 공백으로 구분" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-text-secondary text-xs font-semibold uppercase tracking-wide">위치 정보</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="위도" type="text" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                  <Input label="경도" type="text" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                </div>
                <Input label="주소" type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">공개 범위</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['public', 'followers', 'private'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditVisibility(v)}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all tap-highlight-none ${
                        editVisibility === v ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-surface-2 border-border text-text-secondary'
                      }`}
                    >
                      {v === 'public' ? '전체 공개' : v === 'followers' ? '팔로워' : '나만 보기'}
                    </button>
                  ))}
                </div>
              </div>
              {editError && <div className="bg-error/10 border border-error/20 rounded-xl px-3 py-2 text-error text-sm">{editError}</div>}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" fullWidth onClick={closeEditModal} type="button">취소</Button>
                <Button fullWidth type="submit" isLoading={isSavingEdit} disabled={!editTitle.trim()}>저장</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit profile modal ─────────────────────── */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-3xl border border-white/10 w-full max-w-md p-5 sm:p-6 space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">프로필 수정</h3>
              <button onClick={closeEditProfile} className="p-1 text-text-secondary hover:text-white tap-highlight-none"><X size={20} /></button>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <div
                className="relative cursor-pointer group"
                onClick={() => profileAvatarInputRef.current?.click()}
              >
                <Avatar
                  src={editProfileAvatarPreview || editingAccount.avatar_url}
                  username={editingAccount.username}
                  size="lg"
                />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Pencil size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                ref={profileAvatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setEditProfileAvatar(file)
                    setEditProfileAvatarPreview(URL.createObjectURL(file))
                  }
                }}
                className="hidden"
              />
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input label="사용자명 *" type="text" value={editProfileUsername} onChange={(e) => setEditProfileUsername(e.target.value)} required />
              <Input label="표시 이름" type="text" value={editProfileDisplayName} onChange={(e) => setEditProfileDisplayName(e.target.value)} />
              <div>
                <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wide mb-2">자기소개</label>
                <textarea value={editProfileBio} onChange={(e) => setEditProfileBio(e.target.value)} rows={2} className="input-base resize-none" />
              </div>
              {editProfileError && <div className="bg-error/10 border border-error/20 rounded-xl px-3 py-2 text-error text-sm">{editProfileError}</div>}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" fullWidth onClick={closeEditProfile} type="button">취소</Button>
                <Button fullWidth type="submit" isLoading={isSavingProfile} disabled={!editProfileUsername.trim()}>저장</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Account list ────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Users size={28} className="text-text-muted" />
          </div>
          <p className="text-text-secondary text-base font-medium">가계정이 없습니다</p>
          <p className="text-text-muted text-sm mt-1">위의 &quot;가계정 만들기&quot; 버튼을 클릭하여 생성하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const isExpanded = expandedAccountId === account.id
            return (
              <div key={account.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
                {/* Account row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => toggleExpand(account.id)}
                >
                  <Avatar src={account.avatar_url} username={account.username} size="md" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{account.display_name || account.username}</p>
                    <p className="text-text-secondary text-sm truncate">@{account.username}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-text-muted text-xs">게시물 {account.post_count || 0}개</span>
                      {account.bio && <span className="text-text-muted text-xs truncate max-w-[120px]">{account.bio}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-text-muted">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Action buttons — visible when expanded or on desktop */}
                {isExpanded && (
                  <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); openEditProfile(account) }} leftIcon={<Pencil size={14} />}>
                      프로필 수정
                    </Button>
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setUploadAccountId(account.id) }} leftIcon={<Upload size={14} />}>
                      업로드
                    </Button>
                    <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id) }} leftIcon={<Trash2 size={14} />}>
                      삭제
                    </Button>
                  </div>
                )}

                {/* Expanded: post list */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-4 py-4">
                    {isLoadingPosts ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
                      </div>
                    ) : accountPosts.length === 0 ? (
                      <p className="text-text-muted text-sm text-center py-4">게시물이 없습니다</p>
                    ) : (
                      <div className="space-y-2">
                        {accountPosts.map((post) => (
                          <div key={post.id} className="flex items-center gap-3 bg-surface-2 rounded-xl p-3">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-background shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{post.title}</p>
                              <div className="flex items-center gap-2 text-text-muted text-xs mt-0.5">
                                {post.address && (
                                  <span className="flex items-center gap-0.5 truncate">
                                    <MapPin size={10} className="shrink-0" />
                                    {post.address}
                                  </span>
                                )}
                                <span>{post.like_count} likes</span>
                                <span>{post.comment_count} comments</span>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={`/feed/${post.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-white transition-colors tap-highlight-none"
                              >
                                <ExternalLink size={14} />
                              </a>
                              <button
                                onClick={() => openEditModal(post)}
                                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-primary transition-colors tap-highlight-none"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-red-400 transition-colors tap-highlight-none"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
