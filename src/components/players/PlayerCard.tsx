import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerPositionBadge } from './PlayerPositionBadge'
import type { PlayerWithPosition } from '@/lib/queries/players'

interface PlayerCardProps {
  player: PlayerWithPosition
}

export function PlayerCard({ player }: PlayerCardProps) {
  const birthYear = player.birth_date
    ? new Date(player.birth_date).getFullYear()
    : null

  const secondaryInfo = player.dni
    ? `DNI ${player.dni}`
    : birthYear
    ? `Nacido ${birthYear}`
    : null

  return (
    <Link href={`/jugadores/${player.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] rounded-lg">
      <Card className="bg-card border-border">
        <CardContent className="flex flex-row items-center gap-3 p-4 min-h-[44px]">
          <PlayerAvatar
            src={player.photo_url}
            firstName={player.first_name}
            lastName={player.last_name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-base font-normal truncate">
              {player.first_name} {player.last_name}
            </p>
            {secondaryInfo && (
              <p className="text-sm font-normal text-muted-foreground truncate">
                {secondaryInfo}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PlayerPositionBadge
              positionNumber={player.player_positions?.position_primary ?? null}
            />
            {player.inactivo && (
              <Badge variant="secondary" className="text-muted-foreground text-xs">
                Inactivo
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
