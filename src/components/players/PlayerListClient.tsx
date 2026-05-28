'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDivision } from '@/context/DivisionContext'
import { PlayerCard } from './PlayerCard'
import { EmptyPlayerList } from './EmptyPlayerList'
import type { PlayerWithPosition } from '@/lib/queries/players'

interface PlayerListClientProps {
  initialPlayersByDivision: Record<string, PlayerWithPosition[]>
}

export function PlayerListClient({ initialPlayersByDivision }: PlayerListClientProps) {
  const { activeDivision } = useDivision()

  const players = activeDivision
    ? (initialPlayersByDivision[activeDivision.id] ?? [])
    : []

  return (
    <>
      <div className="flex flex-col gap-2 px-4 py-4">
        {players.length === 0 ? (
          <EmptyPlayerList />
        ) : (
          players.map((p) => <PlayerCard key={p.id} player={p} />)
        )}
      </div>

      {/* FAB — Floating Action Button */}
      <Button
        asChild
        className="fixed right-4 bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] h-14 w-14 rounded-full bg-[color:var(--primary)] shadow-lg p-0"
        aria-label="Agregar jugador"
      >
        <Link href="/jugadores/nuevo">
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      </Button>
    </>
  )
}
