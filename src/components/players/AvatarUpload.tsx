'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PlayerAvatar } from './PlayerAvatar'
import { setPlayerPhotoUrl } from '@/app/(app)/jugadores/actions'

type Props = {
  playerId: string | null // null when used in /nuevo before player is created
  initialPhotoUrl: string | null
  firstName: string
  lastName: string
  onUploaded?: (newUrl: string) => void
}

// Client-side canvas resize: max 800x800, JPEG quality 0.85
function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          resolve(blob)
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

export function AvatarUpload({ playerId, initialPhotoUrl, firstName, lastName, onUploaded }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    try {
      setUploading(true)
      const blob = await resizeImage(file)

      if (playerId === null) {
        // Create mode: preview locally, defer upload until playerId is known
        const previewUrl = URL.createObjectURL(blob)
        setPhotoUrl(previewUrl)
        onUploaded?.(previewUrl)
        // Pass the blob reference via a custom event so PlayerForm can hold it
        // We store the blob on the input element's dataset as a workaround
        // Actually: call onUploaded with the objectURL and let parent hold the blob
        // The parent needs the Blob itself — use a separate callback approach below
        // Since we can't pass Blob through onUploaded(string), the parent will
        // re-fetch the blob from the objectURL. Instead, expose blob via a ref trick:
        // This is handled by PlayerForm using a pendingPhotoBlob state set here.
        // We use a custom DOM event to pass the blob up.
        const blobEvent = new CustomEvent('avatarblob', { detail: blob, bubbles: true })
        inputRef.current?.dispatchEvent(blobEvent)
      } else {
        // Edit mode: upload immediately
        const photoFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
        const fd = new FormData()
        fd.append('playerId', playerId)
        fd.append('photo', photoFile)
        const res = await fetch('/api/players/photo', { method: 'POST', body: fd })
        if (!res.ok) {
          const { error } = await res.json() as { error: string }
          throw new Error(error)
        }
        const { url } = await res.json() as { url: string }
        await setPlayerPhotoUrl(playerId, url)
        setPhotoUrl(url)
        onUploaded?.(url)
      }
    } catch (err) {
      toast.error('No se pudo subir la foto: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <PlayerAvatar
        src={photoUrl}
        firstName={firstName || '?'}
        lastName={lastName || ''}
        size="lg"
      />
      {/* Camera overlay button */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Cambiar foto"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}
