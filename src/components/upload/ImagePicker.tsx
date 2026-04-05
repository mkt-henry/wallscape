'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Camera, Image as ImageIcon, X, RotateCcw, MapPin } from 'lucide-react'
import { extractExifData, createObjectURL, revokeObjectURL, cn } from '@/lib/utils'
import type { Location } from '@/types'

interface ImagePickerProps {
  onSelect: (file: File, preview: string, exifLocation?: Location, photoTakenAt?: string) => void
  selectedImage: File | null
  preview: string | null
}

const MAX_FILE_SIZE_MB = 50
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export function ImagePicker({ onSelect, selectedImage, preview }: ImagePickerProps) {
  const t = useTranslations('upload')
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
      setError(t('imagePickerFormats'))
      return
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(t('imagePickerSize'))
      return
    }

    // Create preview
    const previewUrl = createObjectURL(file)

    // Extract EXIF data (GPS + date)
    setIsExtracting(true)
    const exifData = await extractExifData(file)
    setIsExtracting(false)
    setExifFound(!!exifData.location)

    onSelect(file, previewUrl, exifData.location || undefined, exifData.takenAt || undefined)
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
              <p className="text-white text-xs">{t('imagePickerGps')}</p>
            </div>
          )}

          {!isExtracting && exifFound && (
            <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-2 flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              <p className="text-white text-xs">{t('imagePickerLocationDetected')}</p>
            </div>
          )}

          {!isExtracting && !exifFound && selectedImage && (
            <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-2 flex items-center gap-2">
              <MapPin size={14} className="text-text-muted" />
              <p className="text-white/70 text-xs">{t('locationNoAddress')}</p>
            </div>
          )}
        </div>

        {/* Change photo button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-surface-2 rounded-2xl text-text-secondary text-sm font-medium tap-highlight-none"
        >
          <RotateCcw size={16} />
          {t('imagePickerReselect')}
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

      {/* Camera - Primary action */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4',
          'w-full aspect-[4/3] rounded-3xl',
          'bg-gradient-to-b from-surface-3 to-surface-2 border border-border',
          'transition-all duration-200 cursor-pointer tap-highlight-none',
          'hover:border-primary/50 hover:from-primary/10 hover:to-surface-2'
        )}
      >
        <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center border-2 border-primary/30">
          <Camera size={40} className="text-primary" />
        </div>

        <div className="text-center px-6">
          <p className="text-white font-semibold text-lg mb-1">
            {t('imagePickerCamera')}
          </p>
          <p className="text-text-secondary text-sm">
            {t('imagePickerCameraHint')}
          </p>
        </div>

        {/* Viewfinder corners */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
      </button>

      {/* Gallery - Secondary action */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex items-center gap-4 w-full p-4 rounded-2xl border border-dashed',
          'transition-all duration-200 cursor-pointer tap-highlight-none',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border bg-surface-2 hover:border-border-light hover:bg-surface-3'
        )}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-colors',
            isDragging ? 'bg-primary/20' : 'bg-surface-3'
          )}
        >
          <ImageIcon
            size={22}
            className={isDragging ? 'text-primary' : 'text-text-secondary'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">
            {t('imagePickerSelect')}
          </p>
          <p className="text-text-muted text-xs mt-0.5">
            {t('imagePickerHint', { maxSize: MAX_FILE_SIZE_MB })}
          </p>
        </div>

        {isDragging && (
          <div className="absolute inset-0 rounded-2xl border-2 border-primary bg-primary/5 flex items-center justify-center">
            <p className="text-primary font-semibold">{t('imagePickerDrop')}</p>
          </div>
        )}
      </div>

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
