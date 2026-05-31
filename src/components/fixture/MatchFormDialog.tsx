'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useDivision, isAllDivisions } from '@/context/DivisionContext'
import { MatchFormSchema, type MatchFormInput } from '@/lib/matches/schema'
import { createMatch, updateMatch } from '@/app/(app)/fixture/actions'

type ExistingMatch = {
  id: string
  division_id: string
  match_date: string
  match_time: string | null
  fecha_nro: number | null
  rival: string
  home_away: 'local' | 'visitante'
  venue: string | null
  subequipo: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing?: ExistingMatch
}

export function MatchFormDialog({ open, onOpenChange, existing }: Props) {
  const { activeDivision, divisions, userRole } = useDivision()
  const isAdmin = userRole === 'admin'
  const isEditing = !!existing

  // For coach: division is locked to activeDivision (or existing match's division).
  // For admin in "Todas las divisiones": let them pick from any.
  const defaultDivisionId =
    existing?.division_id ??
    (activeDivision && !isAllDivisions(activeDivision) ? activeDivision.id : divisions[0]?.id ?? '')

  const [divisionId, setDivisionId] = useState(defaultDivisionId)
  const [matchDate, setMatchDate] = useState(existing?.match_date ?? '')
  const [matchTime, setMatchTime] = useState(existing?.match_time ?? '')
  const [rival, setRival] = useState(existing?.rival ?? '')
  const [homeAway, setHomeAway] = useState<'local' | 'visitante'>(existing?.home_away ?? 'local')
  const [venue, setVenue] = useState(existing?.venue ?? '')
  const [subequipo, setSubequipo] = useState(existing?.subequipo ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const input: MatchFormInput = {
      division_id: divisionId,
      match_date: matchDate,
      match_time: matchTime || '',
      fecha_nro: null,
      rival: rival.trim(),
      home_away: homeAway,
      venue: venue.trim() || '',
      subequipo: subequipo.trim() || '',
    }

    const parsed = MatchFormSchema.safeParse(input)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    startTransition(async () => {
      try {
        if (isEditing && existing) {
          await updateMatch(existing.id, parsed.data)
          toast.success('Partido actualizado')
        } else {
          await createMatch(parsed.data)
          toast.success('Partido creado')
        }
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo guardar el partido')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? 'Editar partido'
              : 'Agregar partido'}
          </DialogTitle>
          <DialogDescription>
            Completa los datos del partido. La division y la fecha son obligatorias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            {isAdmin ? (
              <Select value={divisionId} onValueChange={setDivisionId}>
                <SelectTrigger id="division" className="h-11">
                  <SelectValue placeholder="Elegi una division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="division"
                value={divisions.find((d) => d.id === divisionId)?.name ?? ''}
                readOnly
                className="h-11 bg-muted"
              />
            )}
            {errors['division_id'] && <p className="text-sm text-destructive">{errors['division_id']}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="match_date">Fecha</Label>
              <Input id="match_date" type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-11" />
              {errors['match_date'] && <p className="text-sm text-destructive">{errors['match_date']}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="match_time">Hora</Label>
              <Input id="match_time" type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="h-11" />
              {errors['match_time'] && <p className="text-sm text-destructive">{errors['match_time']}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rival">Rival</Label>
            <Input id="rival" placeholder="Nombre del rival" value={rival} onChange={(e) => setRival(e.target.value)} className="h-11" />
            {errors['rival'] && <p className="text-sm text-destructive">{errors['rival']}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="home_away">Local/Visitante</Label>
              <Select value={homeAway} onValueChange={(v) => setHomeAway(v as 'local' | 'visitante')}>
                <SelectTrigger id="home_away" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="visitante">Visitante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subequipo">Subequipo</Label>
              <Input id="subequipo" placeholder="A, B... (opcional)" value={subequipo} onChange={(e) => setSubequipo(e.target.value)} className="h-11" maxLength={4} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Sede</Label>
            <Input id="venue" placeholder="Cancha o club (opcional)" value={venue} onChange={(e) => setVenue(e.target.value)} className="h-11" />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando...' : 'Guardar partido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
