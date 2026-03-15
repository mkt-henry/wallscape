'use client'

import { useRef, useState } from 'react'
import { Camera, Image as ImageIcon, X, RotateCcw, MapPin } from 'lucide-react'
import { extractExifLocation, createObjectURL, revokeObjectURL, cn } from '@/lib/utils'
import type { Location } from '@/types'

interface ImagePickerProps {
  onSelect: (file: File, preview: string, exifLocation?: Location) => void
  selectedImage: File | null
  preview: string | null
}

const MAX_FILE_SIZE_MB = 50
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export function ImagePicker({ onSelect, selectedImage, preview }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [exifFound, setExifFound] = useState(false)

  const processFile = async (file: File) => {
    setError(null)

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      setError('JPG, PNG, WEBP, HEIC 형식만 지원됩니다')
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다`)
      return
    }

    // Create preview
    const previewUrl = createObjectURL(file)

    // Extract EXIF GPS
    setIsExtracting(true)
    const exifLocation = await extractExifLocation(file)
    setIsExtracting(false)
    setExifFound(!!exifLocation)

    onSelect(file, previewUrl, exifLocation || undefined)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleClear = () => {
    if (preview) revokeObjectURL(preview)
    setExifFound(false)
    setError(null)
    onSelect(null as unknown as File, '')
  }

  // If image is selected, show preview
  if (selectedImage && preview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-surface-2 aspect-square">
          <img
            src={preview}
            alt="Selected"
            className="w-full h-full object-cover"
          />

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 w-9 h-9 glass rounded-full flex items-center justify-center tap-highlight-none"
          >
            <X size={18} className="text-white" />
          </button>

          {/* EXIF location badge */}
          {isExtracting && (
            <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-2">
              <p className="text-white text-xs">GPS 추출 중...</p>
            </div>
          )}

          {!isExtracting && exifFound && (
            <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-2 flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              <p className="text-white text-xs">위치 자동 감지됨</p>
            </div>
          )}

          {!isExtracting && !exifFound && selectedImage && (
            <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-2 flex items-center gap-2">
              <MapPin size={14} className="text-text-muted" />
              <p className="text-white/70 text-xs">위치 정보 없음 · 다음 단계에서 직접 설정</p>
            </div>
          )}
        </div>

        {/* Change photo button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-surface-2 rounded-2xl text-text-secondary text-sm font-medium tap-highlight-none"
        >
          <RotateCcw size={16} />
          사진 다시 선택
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.heic"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-2xl">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4',
          'w-full aspect-square rounded-3xl border-2 border-dashed',
          'transition-all duration-200 cursor-pointer tap-highlight-none',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border bg-surface-2 hover:border-border-light hover:bg-surface-3'
        )}
      >
        <div
          className={cn(
            'w-20 h-20 rounded-3xl flex items-center justify-center transition-colors',
            isDragging ? 'bg-primary/20' : 'bg-surface-3'
          )}
        >
          <ImageIcon
            size={36}
            className={isDragging ? 'text-primary' : 'text-text-secondary'}
          />
        </div>

        <div className="text-center px-6">
          <p className="text-white font-semibold mb-1">
            사진을 선택하세요
          </p>
          <p className="text-text-secondary text-sm">
            탭하거나 드래그하여 업로드
          </p>
          <p className="text-text-muted text-xs mt-2">
            JPG, PNG, WEBP, HEIC · 최대 {MAX_FILE_SIZE_MB}MB
          </p>
        </div>

        {isDragging && (
          <div className="absolute inset-0 rounded-3xl border-2 border-primary bg-primary/5 flex items-center justify-center">
            <p className="text-primary font-semibold">놓으세요!</p>
          </div>
        )}
      </div>

      {/* Camera button */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-3 py-4 bg-surface-2 rounded-2xl border border-border tap-highlight-none hover:bg-surface-3 transition-colors"
      >
        <Camera size={22} className="text-primary" />
        <span className="text-white font-medium">카메라로 촬영</span>
      </button>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.heic"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
