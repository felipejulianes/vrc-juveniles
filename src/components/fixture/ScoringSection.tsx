'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ScoringEventRow } from './ScoringEventRow'
import { addScoringEvent } from '@/app/(app)/fixture/[matchId]/actions'

type EventType = 'try' | 'conversion' | 'penalty' | 'drop' | 'yellow_card' | 'red_card'

type Event = {
  id: string
  team: 'home' | 'away'
  event_type: EventType
  player_id: string | null
  rival_scorer: string | null
}

type Player = { id: string; label: string }

type Props = {
  matchId: string
  rivalName: string
  players: Player[]
  events: Event[]
}

const EVENT_TYPES: { value: EventType; label: string; addLabel: string }[] = [
  { value: 'try', label: 'Tries', addLabel: '+ Agregar try' },
  { value: 'conversion', label: 'Conversiones', addLabel: '+ Agregar conversión' },
  { value: 'penalty', label: 'Penales', addLabel: '+ Agregar penal' },
  { value: 'drop', label: 'Drop goals', addLabel: '+ Agregar drop goal' },
  { value: 'yellow_card', label: 'Amarillas', addLabel: '+ Agregar tarjeta amarilla' },
  { value: 'red_card', label: 'Rojas', addLabel: '+ Agregar tarjeta roja' },
]

export function ScoringSection({ matchId, rivalName, players, events }: Props) {
  const [expanded, setExpanded] = useState(events.length === 0)
  const [activeAdd, setActiveAdd] = useState<EventType | null>(null)
  const [team, setTeam] = useState<'home' | 'away'>('home')
  const [playerId, setPlayerId] = useState<string>('')
  const [rivalScorer, setRivalScorer] = useState<string>('')
  const [pending, startTransition] = useTransition()

  function resetForm() {
    setActiveAdd(null)
    setTeam('home')
    setPlayerId('')
    setRivalScorer('')
  }

  function handleAdd(eventType: EventType) {
    startTransition(async () => {
      try {
        await addScoringEvent({
          match_id: matchId,
          team,
          event_type: eventType,
          player_id: team === 'home' ? (playerId || null) : null,
          rival_scorer: team === 'away' ? (rivalScorer.trim() || null) : null,
        })
        toast.success('Evento agregado')
        resetForm()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo agregar el evento')
      }
    })
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-2 text-left h-11"
        >
          <span className="text-base font-semibold">Detalles del resultado</span>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {expanded && (
          <div className="space-y-4 transition-all duration-200">
            {EVENT_TYPES.map((et) => {
              const evs = events.filter((e) => e.event_type === et.value)
              return (
                <div key={et.value} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{et.label}</p>
                  {evs.length === 0 && activeAdd !== et.value && (
                    <p className="text-xs text-muted-foreground">Sin registros</p>
                  )}
                  {evs.map((e) => (
                    <ScoringEventRow key={e.id} event={e} matchId={matchId} players={players} />
                  ))}

                  {activeAdd === et.value ? (
                    <div className="space-y-2 p-3 bg-secondary/30 rounded">
                      <Select value={team} onValueChange={(v) => setTeam(v as 'home' | 'away')}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Virreyes</SelectItem>
                          <SelectItem value="away">{rivalName}</SelectItem>
                        </SelectContent>
                      </Select>

                      {team === 'home' ? (
                        <Select value={playerId} onValueChange={setPlayerId}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Elegí un jugador (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {players.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Nombre del jugador rival (opcional)"
                          value={rivalScorer}
                          onChange={(e) => setRivalScorer(e.target.value)}
                          className="h-11"
                        />
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex-1"
                          onClick={resetForm}
                          disabled={pending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          onClick={() => handleAdd(et.value)}
                          disabled={pending}
                        >
                          {pending ? 'Guardando...' : 'Agregar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline mt-1"
                      onClick={() => setActiveAdd(et.value)}
                    >
                      {et.addLabel}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
