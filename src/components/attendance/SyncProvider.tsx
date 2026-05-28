'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { flushQueue } from '@/lib/offline/queue'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function trySync() {
      try {
        const { flushed, errors } = await flushQueue(supabase)
        if (cancelled) return
        if (flushed > 0 && errors === 0) toast.success('Lista sincronizada')
        else if (errors > 0)
          toast.error('No se pudo sincronizar. Se reintentará automáticamente.')
      } catch {
        if (!cancelled)
          toast.error('No se pudo sincronizar. Se reintentará automáticamente.')
      }
    }

    // Boot: flush whatever is queued from a previous session
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      trySync()
    }

    const handler = () => {
      trySync()
    }
    window.addEventListener('online', handler)

    return () => {
      cancelled = true
      window.removeEventListener('online', handler)
    }
  }, [])

  return <>{children}</>
}
