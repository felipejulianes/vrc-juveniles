'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      className="w-full px-4 py-2 text-center text-sm"
      style={{
        backgroundColor: 'var(--muted)',
        color: 'oklch(0.78 0.17 75)',
      }}
    >
      Sin conexión — tomando lista en modo offline
    </div>
  )
}
