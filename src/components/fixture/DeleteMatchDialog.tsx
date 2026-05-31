'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteMatch } from '@/app/(app)/fixture/actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
  matchLabel: string  // e.g. "Banco Provincia - 12/04"
  redirectAfter?: string
}

export function DeleteMatchDialog({ open, onOpenChange, matchId, matchLabel, redirectAfter }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteMatch(matchId)
        toast.success('Partido eliminado')
        onOpenChange(false)
        if (redirectAfter) router.push(redirectAfter)
        else router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el partido')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar partido</DialogTitle>
          <DialogDescription>
            Eliminar este partido? Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{matchLabel}</p>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
