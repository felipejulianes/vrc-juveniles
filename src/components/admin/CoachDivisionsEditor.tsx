'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { setCoachDivisions } from '@/app/(app)/admin/actions'

type Division = { id: string; name: string }

export function CoachDivisionsEditor({
  coachId,
  coachName,
  divisions,
  assignedIds,
}: {
  coachId: string
  coachName: string
  divisions: Division[]
  assignedIds: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds))
  const [isPending, startTransition] = useTransition()

  const dirty =
    selected.size !== assignedIds.length ||
    assignedIds.some((id) => !selected.has(id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function save() {
    startTransition(async () => {
      try {
        await setCoachDivisions(coachId, Array.from(selected))
        toast.success(`Divisiones actualizadas para ${coachName}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-3 space-y-2">
        <p className="text-sm font-medium">{coachName}</p>
        <div className="flex flex-wrap items-center gap-2">
          {divisions.map((d) => {
            const active = selected.has(d.id)
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(d.id)}
                aria-pressed={active}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  active
                    ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-transparent'
                    : 'bg-transparent text-muted-foreground border-border',
                ].join(' ')}
              >
                {d.name}
              </button>
            )
          })}
          {dirty && (
            <Button size="sm" onClick={save} disabled={isPending} className="ml-auto">
              {isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          )}
        </div>
        {selected.size === 0 && (
          <p className="text-xs text-muted-foreground">
            Sin divisiones juveniles — este coach ve la pantalla de activación pendiente.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
