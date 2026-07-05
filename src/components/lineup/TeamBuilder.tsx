'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlayerAvatar } from '@/components/players/PlayerAvatar'
import { PlayerPositionBadge } from '@/components/players/PlayerPositionBadge'
import { getPositionByNumber } from '@/lib/positions/constants'
import { formatMatchDate } from '@/lib/matches/utils'
import { saveLineup } from '@/app/(app)/fixture/[matchId]/equipo/actions'

export type BuilderPlayer = {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  apto_medico: boolean
  position_primary: number | null
  position_alt1: number | null
  position_alt2: number | null
  attendance: { present: number; total: number; attendedLast: boolean } | null
}

type MatchInfo = {
  id: string
  rival: string
  match_date: string
  match_time: string | null
  home_away: 'local' | 'visitante'
  subequipo: string | null
}

const STARTER_SLOTS = Array.from({ length: 15 }, (_, i) => i + 1)
const BENCH_SLOTS = Array.from({ length: 8 }, (_, i) => i + 16)

function slotLabel(slot: number): string {
  if (slot > 15) return 'Suplente'
  return getPositionByNumber(slot)?.name ?? ''
}

function playerCoversSlot(posNumber: number | null, slot: number): boolean {
  if (posNumber === null) return false
  const role = getPositionByNumber(posNumber)
  return role ? (role.covers as readonly number[]).includes(slot) : false
}

function coversAbbrs(p: BuilderPlayer): string {
  const abbrs: string[] = []
  for (const n of [p.position_primary, p.position_alt1, p.position_alt2]) {
    if (n === null) continue
    const abbr = getPositionByNumber(n)?.abbr
    if (abbr && !abbrs.includes(abbr)) abbrs.push(abbr)
  }
  return abbrs.join(' · ')
}

function AttendanceChip({
  attendance,
}: {
  attendance: BuilderPlayer['attendance']
}) {
  if (!attendance || attendance.total === 0) {
    return <span className="text-xs text-muted-foreground">Sin datos</span>
  }
  const ratio = attendance.present / attendance.total
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {attendance.attendedLast && (
        <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--chart-2)]" />
      )}
      <span className={ratio < 0.5 ? 'text-[color:var(--destructive)]' : undefined}>
        {attendance.present}/{attendance.total} entren.
      </span>
    </span>
  )
}

export function TeamBuilder({
  match,
  players,
  initialLineup,
}: {
  match: MatchInfo
  players: BuilderPlayer[]
  initialLineup: { slot: number; player_id: string }[]
}) {
  const [assignments, setAssignments] = useState<Record<number, string>>(() =>
    Object.fromEntries(initialLineup.map((e) => [e.slot, e.player_id]))
  )
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [isPending, startTransition] = useTransition()

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  )
  const assignedIds = useMemo(
    () => new Set(Object.values(assignments)),
    [assignments]
  )

  const starterCount = STARTER_SLOTS.filter((s) => assignments[s]).length
  const benchCount = BENCH_SLOTS.filter((s) => assignments[s]).length
  const sinApto = Object.values(assignments)
    .map((id) => playerById.get(id))
    .filter((p) => p && !p.apto_medico).length

  const candidates = useMemo(() => {
    if (pickerSlot === null) return []
    const available = players.filter(
      (p) => !assignedIds.has(p.id) || assignments[pickerSlot] === p.id
    )
    const rank = (p: BuilderPlayer): number => {
      if (pickerSlot > 15) return 0
      if (playerCoversSlot(p.position_primary, pickerSlot)) return 0
      if (
        playerCoversSlot(p.position_alt1, pickerSlot) ||
        playerCoversSlot(p.position_alt2, pickerSlot)
      )
        return 1
      return 2
    }
    return [...available].sort((a, b) => {
      const r = rank(a) - rank(b)
      if (r !== 0) return r
      const la = a.attendance?.attendedLast ? 0 : 1
      const lb = b.attendance?.attendedLast ? 0 : 1
      if (la !== lb) return la - lb
      const pa = a.attendance?.present ?? 0
      const pb = b.attendance?.present ?? 0
      if (pa !== pb) return pb - pa
      return a.last_name.localeCompare(b.last_name, 'es-AR')
    })
  }, [pickerSlot, players, assignedIds, assignments])

  function assign(slot: number, playerId: string) {
    setAssignments((prev) => ({ ...prev, [slot]: playerId }))
    setDirty(true)
    setPickerSlot(null)
  }

  function clear(slot: number) {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[slot]
      return next
    })
    setDirty(true)
    setPickerSlot(null)
  }

  function handleSave() {
    const entries = Object.entries(assignments).map(([slot, player_id]) => ({
      slot: Number(slot),
      player_id,
    }))
    startTransition(async () => {
      try {
        await saveLineup(match.id, entries)
        setDirty(false)
        toast.success('Formación guardada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  function SlotRow({ slot }: { slot: number }) {
    const playerId = assignments[slot]
    const player = playerId ? playerById.get(playerId) : undefined
    const label = slotLabel(slot)

    return (
      <button
        onClick={() => setPickerSlot(slot)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border text-left active:bg-accent/20 transition-colors"
      >
        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold shrink-0">
          {slot}
        </span>
        {player ? (
          <>
            <PlayerAvatar
              src={player.photo_url}
              firstName={player.first_name}
              lastName={player.last_name}
              size="sm"
            />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">
                {player.last_name}, {player.first_name}
              </span>
              <span className="flex items-center gap-2">
                <AttendanceChip attendance={player.attendance} />
                {slot > 15 && (
                  <span className="text-xs text-muted-foreground truncate">
                    {coversAbbrs(player) || 'Sin puesto'}
                  </span>
                )}
              </span>
            </span>
            {!player.apto_medico && (
              <AlertTriangle
                className="h-4 w-4 shrink-0 text-[color:var(--destructive)]"
                aria-label="Sin apto médico"
              />
            )}
          </>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">
            {label} — <span className="text-[color:var(--primary)]">asignar</span>
          </span>
        )}
        {player && slot <= 15 && (
          <span className="text-xs text-muted-foreground shrink-0">{label}</span>
        )}
      </button>
    )
  }

  const timeShort = match.match_time ? match.match_time.slice(0, 5) : null

  return (
    <div className="px-4 pt-4 pb-36 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={`/fixture/${match.id}`}
          className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground"
          aria-label="Volver al partido"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold truncate">
          Equipo vs {match.rival}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {formatMatchDate(match.match_date)}
        {timeShort ? ` · ${timeShort}` : ''} ·{' '}
        {match.home_away === 'local' ? 'Local' : 'Visitante'}
        {match.subequipo ? ` · ${match.subequipo}` : ''}
      </p>

      {sinApto > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-[color:var(--destructive)]/40 text-sm text-[color:var(--destructive)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {sinApto === 1
            ? '1 jugador seleccionado sin apto médico'
            : `${sinApto} jugadores seleccionados sin apto médico`}
        </div>
      )}

      {/* Titulares */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Forwards
      </h2>
      <div className="space-y-1.5 mb-5">
        {STARTER_SLOTS.slice(0, 8).map((s) => (
          <SlotRow key={s} slot={s} />
        ))}
      </div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Backs
      </h2>
      <div className="space-y-1.5 mb-5">
        {STARTER_SLOTS.slice(8).map((s) => (
          <SlotRow key={s} slot={s} />
        ))}
      </div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Suplentes
      </h2>
      <div className="space-y-1.5">
        {BENCH_SLOTS.map((s) => (
          <SlotRow key={s} slot={s} />
        ))}
      </div>

      {/* Barra de guardado */}
      <div
        className="fixed left-0 right-0 z-40 px-4 py-3 border-t"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground shrink-0">
            {starterCount}/15 titulares
            {benchCount > 0 ? ` · ${benchCount} supl.` : ''}
          </span>
          <Button
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="flex-1"
          >
            {isPending ? 'Guardando…' : dirty ? 'Guardar formación' : 'Guardado ✓'}
          </Button>
        </div>
      </div>

      {/* Picker */}
      <Dialog
        open={pickerSlot !== null}
        onOpenChange={(open) => !open && setPickerSlot(null)}
      >
        <DialogContent className="max-h-[80dvh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-2 sticky top-0 bg-[color:var(--popover)] z-10">
            <DialogTitle className="text-base">
              {pickerSlot !== null && pickerSlot <= 15
                ? `${pickerSlot} · ${slotLabel(pickerSlot)}`
                : `Suplente ${pickerSlot ?? ''}`}
            </DialogTitle>
          </DialogHeader>
          <div className="px-2 pb-4">
            {pickerSlot !== null && assignments[pickerSlot] && (
              <button
                onClick={() => clear(pickerSlot)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[color:var(--destructive)] hover:bg-accent/10"
              >
                <X className="h-4 w-4" /> Quitar jugador
              </button>
            )}
            {candidates.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                No quedan jugadores disponibles.
              </p>
            )}
            {candidates.map((p) => {
              const isCurrent =
                pickerSlot !== null && assignments[pickerSlot] === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => pickerSlot !== null && assign(pickerSlot, p.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent/10 ${
                    isCurrent ? 'bg-accent/15' : ''
                  }`}
                >
                  <PlayerAvatar
                    src={p.photo_url}
                    firstName={p.first_name}
                    lastName={p.last_name}
                    size="sm"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">
                      {p.last_name}, {p.first_name}
                    </span>
                    <AttendanceChip attendance={p.attendance} />
                  </span>
                  {!p.apto_medico && (
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 text-[color:var(--destructive)]"
                      aria-label="Sin apto médico"
                    />
                  )}
                  <PlayerPositionBadge positionNumber={p.position_primary} />
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
