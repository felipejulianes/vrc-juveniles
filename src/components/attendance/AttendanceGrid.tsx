'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { enqueueAttendance } from '@/lib/offline/queue'
import { cachePlayersForDivision, getCachedPlayers } from '@/lib/offline/playerCache'
import { upsertAttendance } from '@/app/(app)/lista/actions'
import { PlayerAvatar } from '@/components/players/PlayerAvatar'
import { PlayerPositionBadge } from '@/components/players/PlayerPositionBadge'
import { Badge } from '@/components/ui/badge'
import type { PlayerWithPosition } from '@/lib/queries/players'

interface AttendanceGridProps {
  sessionId: string
  divisionId: string
  initialPlayers: PlayerWithPosition[]
  initialAttendance: Record<string, boolean>
}

export function AttendanceGrid({
  sessionId,
  divisionId,
  initialPlayers,
  initialAttendance,
}: AttendanceGridProps) {
  const isOnline = useOnlineStatus()
  const [players, setPlayers] = useState<PlayerWithPosition[]>(initialPlayers)
  const [attendance, setAttendance] = useState<Record<string, boolean>>(initialAttendance)
  const [pendingCount, setPendingCount] = useState(0)

  // On mount: cache players if fetched online; load from cache if offline
  useEffect(() => {
    if (initialPlayers.length > 0) {
      // Online: warm the cache for future offline access
      cachePlayersForDivision(divisionId, initialPlayers).catch(() => {
        // Ignore cache write errors silently
      })
    } else {
      // Offline: load from cache
      getCachedPlayers(divisionId)
        .then((cached) => {
          if (cached.length > 0) {
            setPlayers(cached)
          }
        })
        .catch(() => {
          // Cache unavailable
        })
    }
  }, [divisionId, initialPlayers])

  // Sort: inactive players last
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.inactivo === b.inactivo) {
      const lastCmp = a.last_name.localeCompare(b.last_name, 'es')
      if (lastCmp !== 0) return lastCmp
      return a.first_name.localeCompare(b.first_name, 'es')
    }
    return a.inactivo ? 1 : -1
  })

  const presentCount = Object.values(attendance).filter(Boolean).length
  const totalCount = players.length

  async function onTapPlayer(playerId: string) {
    const newPresent = !attendance[playerId]

    // Optimistic update
    setAttendance((prev) => ({ ...prev, [playerId]: newPresent }))

    if (isOnline) {
      try {
        await upsertAttendance(sessionId, playerId, newPresent)
      } catch (e) {
        // Revert on error
        setAttendance((prev) => ({ ...prev, [playerId]: !newPresent }))
        toast.error(e instanceof Error ? e.message : 'Error al guardar asistencia')
      }
    } else {
      try {
        await enqueueAttendance({
          session_id: sessionId,
          player_id: playerId,
          present: newPresent,
          timestamp: Date.now(),
        })
        // Update pending count
        setPendingCount((c) => c + 1)
      } catch {
        // Queue write failed — revert
        setAttendance((prev) => ({ ...prev, [playerId]: !newPresent }))
        toast.error('No se pudo guardar el cambio offline')
      }
    }
  }

  if (players.length === 0 && !isOnline) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <p className="text-base text-muted-foreground">
          No hay jugadores en caché para esta división. Conectate al menos una vez para sincronizar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {presentCount} de {totalCount} presentes
        </p>
      </div>

      {/* Player rows */}
      <div className="flex flex-col gap-2">
        {sortedPlayers.map((player) => {
          const isPresent = attendance[player.id] === true
          return (
            <div
              key={player.id}
              role="button"
              tabIndex={0}
              onClick={() => onTapPlayer(player.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onTapPlayer(player.id)
              }}
              className="min-h-[44px] rounded-lg border p-3 flex items-center gap-3 cursor-pointer transition-colors"
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
                size="sm"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-base font-medium leading-tight truncate">
                  {player.last_name}, {player.first_name}
                </span>
                {player.dni && (
                  <span className="text-sm text-muted-foreground">{player.dni}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PlayerPositionBadge
                  positionNumber={player.player_positions?.position_primary ?? null}
                />
                {player.inactivo && (
                  <Badge variant="secondary" className="text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Offline pending indicator */}
      {!isOnline && pendingCount > 0 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          {pendingCount} {pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
        </div>
      )}
    </div>
  )
}
