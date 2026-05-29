'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { enqueueAttendance } from '@/lib/offline/queue'
import { cachePlayersForDivision, getCachedPlayers } from '@/lib/offline/playerCache'
import { upsertAttendance } from '@/app/(app)/lista/actions'
import { PlayerAvatar } from '@/components/players/PlayerAvatar'
import { Badge } from '@/components/ui/badge'
import type { PlayerWithPosition } from '@/lib/queries/players'

interface AttendanceGridProps {
  sessionId: string
  divisionId: string
  sessionDate: string
  initialPlayers: PlayerWithPosition[]
  initialAttendance: Record<string, boolean>
}

function formatDate(sessionDate: string): string {
  const date = new Date(sessionDate + 'T12:00:00')
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const day = days[date.getDay()] ?? ''
  const parts = sessionDate.split('-')
  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : sessionDate
  return `${day} ${formatted}`
}

export function AttendanceGrid({
  sessionId,
  divisionId,
  sessionDate,
  initialPlayers,
  initialAttendance,
}: AttendanceGridProps) {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [players, setPlayers] = useState<PlayerWithPosition[]>(initialPlayers)
  const [attendance, setAttendance] = useState<Record<string, boolean>>(initialAttendance)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (initialPlayers.length > 0) {
      cachePlayersForDivision(divisionId, initialPlayers).catch(() => {})
    } else {
      getCachedPlayers(divisionId)
        .then((cached) => { if (cached.length > 0) setPlayers(cached) })
        .catch(() => {})
    }
  }, [divisionId, initialPlayers])

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.inactivo !== b.inactivo) return a.inactivo ? 1 : -1
    const lastCmp = a.last_name.localeCompare(b.last_name, 'es')
    return lastCmp !== 0 ? lastCmp : a.first_name.localeCompare(b.first_name, 'es')
  })

  const presentCount = Object.values(attendance).filter(Boolean).length

  async function onTapPlayer(playerId: string) {
    const newPresent = !attendance[playerId]
    setAttendance((prev) => ({ ...prev, [playerId]: newPresent }))

    if (isOnline) {
      try {
        await upsertAttendance(sessionId, playerId, newPresent)
        toast.success(newPresent ? 'Presente ✓' : 'Ausente', { duration: 1200 })
      } catch (e) {
        setAttendance((prev) => ({ ...prev, [playerId]: !newPresent }))
        toast.error(e instanceof Error ? e.message : 'Error al guardar asistencia')
      }
    } else {
      try {
        await enqueueAttendance({ session_id: sessionId, player_id: playerId, present: newPresent, timestamp: Date.now() })
        setPendingCount((c) => c + 1)
      } catch {
        setAttendance((prev) => ({ ...prev, [playerId]: !newPresent }))
        toast.error('No se pudo guardar el cambio offline')
      }
    }
  }

  if (players.length === 0 && !isOnline) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground w-fit">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Volver</span>
        </button>
        <p className="text-base text-muted-foreground text-center py-16 px-6">
          No hay jugadores en caché para esta división. Conectate al menos una vez para sincronizar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-2">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors"
          aria-label="Volver"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">{formatDate(sessionDate)}</h1>
          <p className="text-sm text-muted-foreground">
            {presentCount} de {players.length} presentes
            {!isOnline && pendingCount > 0 && ` · ${pendingCount} pendientes`}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 px-4">
        {sortedPlayers.map((player) => {
          const isPresent = attendance[player.id] === true
          return (
            <button
              key={player.id}
              onClick={() => onTapPlayer(player.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border text-left transition-colors"
              style={
                isPresent
                  ? {
                      backgroundColor: 'color-mix(in oklab, var(--primary) 20%, transparent)',
                      borderColor: 'var(--primary)',
                    }
                  : undefined
              }
            >
              <PlayerAvatar
                src={player.photo_url}
                firstName={player.first_name}
                lastName={player.last_name}
                size="md"
              />
              <div className="flex flex-col items-center gap-0.5 w-full">
                <span className="text-xs font-semibold text-center leading-tight line-clamp-1 w-full">
                  {player.first_name}
                </span>
                <span className="text-xs text-muted-foreground text-center leading-tight line-clamp-1 w-full">
                  {player.last_name}
                </span>
                {player.inactivo && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">
                    Inactivo
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </div>

    </div>
  )
}
