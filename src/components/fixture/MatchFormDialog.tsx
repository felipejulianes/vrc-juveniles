'use client'

// Stub — Plan 03 will implement the full create/edit functionality.
// This placeholder keeps Plan 04 buildable while Plan 03 runs in parallel.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="text-base font-semibold">
            {existing ? 'Editar partido' : 'Agregar partido'}
          </p>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Formulario de partido — disponible en la próxima actualización.
        </p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled>
            Guardar partido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
