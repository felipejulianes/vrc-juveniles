'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MatchResultSchema } from '@/lib/matches/schema'
import { saveResult } from '@/app/(app)/fixture/[matchId]/actions'

type Props = {
  matchId: string
  rivalName: string
  initialScoreHome: number | null
  initialScoreAway: number | null
}

export function ResultEditor({ matchId, rivalName, initialScoreHome, initialScoreAway }: Props) {
  const [home, setHome] = useState<string>(initialScoreHome != null ? String(initialScoreHome) : '')
  const [away, setAway] = useState<string>(initialScoreAway != null ? String(initialScoreAway) : '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    const homeNum = home === '' ? null : Number(home)
    const awayNum = away === '' ? null : Number(away)
    if ((homeNum === null) !== (awayNum === null)) {
      setError('Ambos puntajes deben estar cargados o ambos vacíos')
      return
    }
    if (homeNum !== null && (isNaN(homeNum) || homeNum < 0 || homeNum > 200)) {
      setError('Puntaje propio inválido')
      return
    }
    if (awayNum !== null && (isNaN(awayNum) || awayNum < 0 || awayNum > 200)) {
      setError('Puntaje rival inválido')
      return
    }
    const parsed = MatchResultSchema.safeParse({ score_home: homeNum, score_away: awayNum })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Resultado inválido')
      return
    }

    startTransition(async () => {
      try {
        await saveResult(matchId, parsed.data)
        toast.success('Resultado guardado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo guardar el resultado')
      }
    })
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="score_home" className="text-sm text-muted-foreground">
            Virreyes
          </Label>
          <Input
            id="score_home"
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="h-14 text-4xl font-bold text-center"
            placeholder="-"
            aria-label="Puntos Virreyes"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="score_away" className="text-sm text-muted-foreground truncate">
            {rivalName}
          </Label>
          <Input
            id="score_away"
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="h-14 text-4xl font-bold text-center"
            placeholder="-"
            aria-label={`Puntos ${rivalName}`}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="button" className="w-full h-12" onClick={handleSave} disabled={pending}>
        {pending ? 'Guardando...' : 'Guardar resultado'}
      </Button>
    </section>
  )
}
