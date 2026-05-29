import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getById, getNotes } from '@/lib/queries/players'
import { getPositionByNumber } from '@/lib/positions/constants'
import { PlayerPositionBadge } from '@/components/players/PlayerPositionBadge'
import { AvatarUpload } from '@/components/players/AvatarUpload'
import { PlayerProfileActions } from '@/components/players/PlayerProfileActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: { id: string }
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function relativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const rtf = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })

  if (diffDays >= 365) return rtf.format(-Math.floor(diffDays / 365), 'year')
  if (diffDays >= 30) return rtf.format(-Math.floor(diffDays / 30), 'month')
  if (diffDays >= 1) return rtf.format(-diffDays, 'day')
  if (diffHours >= 1) return rtf.format(-diffHours, 'hour')
  if (diffMinutes >= 1) return rtf.format(-diffMinutes, 'minute')
  return 'ahora mismo'
}

function getPositionName(positionNumber: number | null): string | null {
  return getPositionByNumber(positionNumber)?.name ?? null
}

export default async function JugadorProfilePage({ params }: Props) {
  const player = await getById(params.id)
  if (!player) notFound()

  const notes = await getNotes(params.id)

  const positions = player.player_positions
  const primaryPos = positions?.position_primary ?? null
  const alt1Pos = positions?.position_alt1 ?? null
  const alt2Pos = positions?.position_alt2 ?? null
  const hasPositions = primaryPos !== null || alt1Pos !== null || alt2Pos !== null

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Back navigation */}
      <Link
        href="/jugadores"
        className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
        Jugadores
      </Link>

      {/* Header card — avatar (re-uploadable) + name */}
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center py-6 px-6 gap-3">
          <AvatarUpload
            playerId={player.id}
            initialPhotoUrl={player.photo_url}
            firstName={player.first_name}
            lastName={player.last_name}
          />
          <h1 className="text-xl font-semibold text-center">
            {player.first_name} {player.last_name}
          </h1>
          {player.inactivo && (
            <Badge variant="secondary" className="text-muted-foreground">
              Inactivo
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Datos section */}
      <Card className="bg-card border-border mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">DNI</span>
            <span className="text-base">{player.dni ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fecha de nacimiento</span>
            <span className="text-base">{formatDate(player.birth_date)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Teléfono del padre/madre</span>
            <span className="text-base">{player.parent_phone ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Padre/Madre</span>
            <span className="text-base">{player.parent_name ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Apto médico</span>
            <span className={`text-base font-medium ${player.apto_medico ? 'text-green-500' : 'text-muted-foreground'}`}>
              {player.apto_medico ? 'Presentado' : 'Pendiente'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Posiciones section */}
      <Card className="bg-card border-border mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Posiciones</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPositions ? (
            <p className="text-sm text-muted-foreground">Sin puestos registrados</p>
          ) : (
            <div className="space-y-3">
              {primaryPos !== null && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-32 shrink-0">
                    Puesto principal
                  </span>
                  <PlayerPositionBadge positionNumber={primaryPos} />
                  <span className="text-base">{getPositionName(primaryPos)}</span>
                </div>
              )}
              {alt1Pos !== null && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-32 shrink-0">
                    Puesto alternativo
                  </span>
                  <PlayerPositionBadge positionNumber={alt1Pos} />
                  <span className="text-base">{getPositionName(alt1Pos)}</span>
                </div>
              )}
              {alt2Pos !== null && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-32 shrink-0">
                    Puesto alternativo 2
                  </span>
                  <PlayerPositionBadge positionNumber={alt2Pos} />
                  <span className="text-base">{getPositionName(alt2Pos)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bitácora section */}
      <Card className="bg-card border-border mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Bitácora</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-sm text-muted-foreground mb-3">Notas recientes</h2>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="border-l-2 border-border pl-3">
                  <p className="text-base">{note.content}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {relativeTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones section — wired to Server Actions via PlayerProfileActions */}
      <PlayerProfileActions
        playerId={player.id}
        playerName={`${player.first_name} ${player.last_name}`}
      />
    </div>
  )
}
