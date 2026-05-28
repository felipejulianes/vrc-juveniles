'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { softDeletePlayer } from '@/app/(app)/jugadores/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Props = {
  playerId: string
  playerName: string
}

export function DeletePlayerDialog({ playerId, playerName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    try {
      setPending(true)
      await softDeletePlayer(playerId)
      toast.success('Jugador marcado como inactivo')
      setOpen(false)
      router.push('/jugadores')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar jugador
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogDescription>
            {`¿Eliminar a ${playerName}? Esta acción no se puede deshacer.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
