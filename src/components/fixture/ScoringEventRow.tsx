'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteScoringEvent } from '@/app/(app)/fixture/[matchId]/actions'

type Event = {
  id: string
  team: 'home' | 'away'
  event_type: 'try' | 'conversion' | 'penalty' | 'drop' | 'yellow_card' | 'red_card'
  player_id: string | null
  rival_scorer: string | null
}

type Player = { id: string; label: string }

type Props = {
  event: Event
  matchId: string
  players: Player[]
}

const EVENT_LABEL: Record<Event['event_type'], string> = {
  try: 'Try',
  conversion: 'Conversión',
  penalty: 'Penal',
  drop: 'Drop goal',
  yellow_card: 'Amarilla',
  red_card: 'Roja',
}

export function ScoringEventRow({ event, matchId, players }: Props) {
  const [pending, startTransition] = useTransition()

  let scorerLabel = ''
  if (event.team === 'home') {
    scorerLabel = players.find((p) => p.id === event.player_id)?.label ?? '(jugador no disponible)'
  } else {
    scorerLabel = event.rival_scorer || '(rival sin nombre)'
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteScoringEvent(event.id, matchId)
        toast.success('Evento eliminado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo eliminar')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{scorerLabel}</p>
        <p className="text-xs text-muted-foreground">
          {EVENT_LABEL[event.event_type]} - {event.team === 'home' ? 'Virreyes' : 'Rival'}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
        aria-label="Eliminar evento"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
