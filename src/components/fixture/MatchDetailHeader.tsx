import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatMatchDate } from '@/lib/matches/utils'

type Props = {
  match: {
    id: string
    rival: string
    match_date: string
    match_time: string | null
    home_away: 'local' | 'visitante'
    venue: string | null
    subequipo: string | null
    fecha_nro: number | null
  }
}

export function MatchDetailHeader({ match }: Props) {
  const timeShort = match.match_time ? match.match_time.slice(0, 5) : null

  return (
    <div className="space-y-3">
      <Link
        href="/fixture"
        className="inline-flex items-center gap-1 text-base font-semibold h-11 -ml-2 px-2 rounded focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        Fixture
      </Link>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{formatMatchDate(match.match_date)}</span>
            <div className="flex items-center gap-1.5">
              {match.fecha_nro != null && (
                <span className="text-sm text-muted-foreground">Fecha #{match.fecha_nro}</span>
              )}
              {match.subequipo && (
                <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-1.5 py-0.5 rounded">
                  {match.subequipo}
                </span>
              )}
            </div>
          </div>
          <h1 className="text-xl font-semibold leading-tight">{match.rival}</h1>
          <p className="text-sm text-muted-foreground">
            {match.home_away === 'local' ? 'Local' : 'Visitante'}
            {timeShort ? ` - ${timeShort}` : ''}
            {match.venue ? ` - ${match.venue}` : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
