import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ResultBadge } from './ResultBadge'
import { formatMatchDate, getMatchResult } from '@/lib/matches/utils'

type MatchCardProps = {
  id: string
  match_date: string
  rival: string
  home_away: 'local' | 'visitante'
  match_time: string | null
  fecha_nro: number | null
  subequipo: string | null
  score_home: number | null
  score_away: number | null
}

export function MatchCard({
  id,
  match_date,
  rival,
  home_away,
  match_time,
  fecha_nro,
  subequipo,
  score_home,
  score_away,
}: MatchCardProps) {
  const result = getMatchResult(score_home, score_away, match_date)
  const isPastUnscored = result === 'pending' && new Date(match_date + 'T23:59:59') < new Date()
  const timeShort = match_time ? match_time.slice(0, 5) : null

  return (
    <Link
      href={`/fixture/${id}`}
      className="block rounded-lg focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
    >
      <Card className="bg-card border-border hover:bg-accent transition-colors min-h-[72px]">
        <CardContent className="p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{formatMatchDate(match_date)}</span>
            <div className="flex items-center gap-1.5">
              {fecha_nro != null && (
                <span className="text-sm text-muted-foreground">Fecha #{fecha_nro}</span>
              )}
              {subequipo && (
                <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-1.5 py-0.5 rounded">
                  {subequipo}
                </span>
              )}
              <ResultBadge result={result} scoreHome={score_home} scoreAway={score_away} />
            </div>
          </div>
          <p className="text-base font-semibold leading-tight truncate">{rival}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {home_away === 'local' ? 'Local' : 'Visitante'}
              {timeShort ? ` · ${timeShort}` : ''}
              {isPastUnscored ? ' · Sin resultado cargado' : ''}
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
