'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DeleteMatchDialog } from './DeleteMatchDialog'
import { MatchFormDialog } from './MatchFormDialog'

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
  match: ExistingMatch
  matchLabel: string
}

export function MatchAdminBar({ match, matchLabel }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-2 pt-2">
        <p className="text-sm text-muted-foreground">Acciones de admin</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4 mr-2" aria-hidden />
            Editar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => setDeleting(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden />
            Eliminar partido
          </Button>
        </div>
      </div>
      <MatchFormDialog open={editing} onOpenChange={setEditing} existing={match} />
      <DeleteMatchDialog
        open={deleting}
        onOpenChange={setDeleting}
        matchId={match.id}
        matchLabel={matchLabel}
        redirectAfter="/fixture"
      />
    </>
  )
}
