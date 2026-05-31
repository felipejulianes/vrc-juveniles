'use client'

import { Plus } from 'lucide-react'

type Props = {
  onClick: () => void
}

export function MatchFab({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Agregar partido"
      className="fixed right-4 w-14 h-14 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-lg flex items-center justify-center active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:outline-none"
      style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <Plus className="h-6 w-6" aria-hidden />
    </button>
  )
}
