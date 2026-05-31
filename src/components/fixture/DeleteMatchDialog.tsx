'use client'

// Stub — Plan 03 will implement the full delete functionality.
// This placeholder keeps Plan 04 buildable while Plan 03 runs in parallel.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
  matchLabel: string
  redirectAfter?: string
}

export function DeleteMatchDialog({ open, onOpenChange, matchLabel }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="text-base font-semibold">Eliminar partido</p>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &iquest;Eliminar este partido? Esta acción no se puede deshacer.
        </p>
        <p className="text-sm">{matchLabel}</p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" disabled>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
