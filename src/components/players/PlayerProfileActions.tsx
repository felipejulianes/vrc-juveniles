'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeletePlayerDialog } from './DeletePlayerDialog'

type Props = {
  playerId: string
  playerName: string
}

export function PlayerProfileActions({ playerId, playerName }: Props) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button
        asChild
        variant="default"
        className="w-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
      >
        <Link href={`/jugadores/${playerId}/editar`}>Editar</Link>
      </Button>
      <DeletePlayerDialog playerId={playerId} playerName={playerName} />
    </div>
  )
}
