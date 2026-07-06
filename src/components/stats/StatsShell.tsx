'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PlayerAvatar } from '@/components/players/PlayerAvatar'
import { useDivision, isAllDivisions } from '@/context/DivisionContext'
import { formatMatchDate } from '@/lib/matches/utils'
import type { DivisionKpis, SessionTrendPoint } from '@/lib/queries/stats'

export type PlayerStatRow = {
  player_id: string
  first_name: string
  last_name: string
  photo_url: string | null
  pct_year: number | null
  present_year: number
  total_year: number
  pct_30d: number | null
  present_30d: number
  total_30d: number
}

export type DivisionStatsData = {
  kpis: DivisionKpis | null
  trend: SessionTrendPoint[]
  players: PlayerStatRow[]
}

const LOW_ATTENDANCE_PCT = 60

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-lg bg-card border border-border px-3 py-2.5">
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

/** Barras de presentes por entrenamiento — serie única, sin leyenda. */
function TrendBars({ trend }: { trend: SessionTrendPoint[] }) {
  if (trend.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay entrenamientos registrados.
      </p>
    )
  }
  const max = Math.max(...trend.map((t) => t.present_count), 1)
  const last = trend[trend.length - 1]

  return (
    <div>
      <div className="flex items-end gap-[2px] h-24">
        {trend.map((t, i) => {
          const h = Math.max((t.present_count / max) * 100, 4)
          const isLast = i === trend.length - 1
          return (
            <div
              key={t.session_id}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={`${formatMatchDate(t.session_date)}: ${t.present_count} presentes`}
              aria-label={`${formatMatchDate(t.session_date)}: ${t.present_count} presentes`}
            >
              {isLast && (
                <span className="text-xs font-semibold mb-0.5">
                  {t.present_count}
                </span>
              )}
              <div
                className="w-full rounded-t-[4px]"
                style={{
                  height: `${h}%`,
                  backgroundColor: 'var(--primary)',
                  opacity: isLast ? 1 : 0.75,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>{formatMatchDate(trend[0].session_date)}</span>
        {trend.length > 1 && <span>{formatMatchDate(last.session_date)}</span>}
      </div>
    </div>
  )
}

function pctText(pct: number | null): string {
  return pct !== null ? `${Math.round(pct)}%` : '—'
}

export function StatsShell({
  dataByDivision,
}: {
  dataByDivision: Record<string, DivisionStatsData>
}) {
  const { activeDivision } = useDivision()

  if (!activeDivision || isAllDivisions(activeDivision)) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Estadística</h1>
        <p className="text-sm text-muted-foreground">
          Elegí una división en el selector de arriba.
        </p>
      </div>
    )
  }

  const data = dataByDivision[activeDivision.id]
  const kpis = data?.kpis ?? null
  const trend = data?.trend ?? []
  const players = data?.players ?? []

  const sorted = [...players].sort((a, b) => {
    const pa = a.pct_year ?? -1
    const pb = b.pct_year ?? -1
    if (pa !== pb) return pb - pa
    return a.last_name.localeCompare(b.last_name, 'es-AR')
  })

  const lowCount = players.filter(
    (p) => p.pct_30d !== null && p.pct_30d < LOW_ATTENDANCE_PCT && p.total_30d > 0
  ).length

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estadística</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Asistencia de {activeDivision.name}
        </p>
      </div>

      {kpis && (
        <div className="flex gap-2">
          <StatTile value={String(kpis.activePlayers)} label="Jugadores" />
          <StatTile value={pctText(kpis.pct30d)} label="Asistencia 30d" />
          <StatTile
            value={kpis.sessions30d > 0 ? String(kpis.avgPresent30d) : '—'}
            label="Prom. por entren."
          />
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Presentes por entrenamiento (últimos {Math.max(trend.length, 1)})
          </p>
          <TrendBars trend={trend} />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Por jugador
            </p>
            {lowCount > 0 && (
              <span className="text-xs text-[color:var(--destructive)]">
                {lowCount} con baja asistencia (&lt;{LOW_ATTENDANCE_PCT}% 30d)
              </span>
            )}
          </div>

          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin datos de asistencia todavía.
            </p>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 pb-1.5 border-b border-border text-xs text-muted-foreground">
                <span>Jugador</span>
                <span className="w-14 text-right">30 días</span>
                <span className="w-14 text-right">Año</span>
              </div>
              {sorted.map((p) => {
                const isLow =
                  p.pct_30d !== null &&
                  p.pct_30d < LOW_ATTENDANCE_PCT &&
                  p.total_30d > 0
                return (
                  <div
                    key={p.player_id}
                    className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-2 border-b border-border/50 last:border-b-0"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <PlayerAvatar
                        src={p.photo_url}
                        firstName={p.first_name}
                        lastName={p.last_name}
                        size="sm"
                      />
                      <span className="text-sm truncate">
                        {p.last_name}, {p.first_name}
                      </span>
                    </span>
                    <span
                      className={`w-14 text-right text-sm font-medium ${
                        isLow ? 'text-[color:var(--destructive)]' : ''
                      }`}
                    >
                      {pctText(p.pct_30d)}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {p.total_30d > 0 ? `${p.present_30d}/${p.total_30d}` : ''}
                      </span>
                    </span>
                    <span className="w-14 text-right text-sm font-medium">
                      {pctText(p.pct_year)}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {p.total_year > 0 ? `${p.present_year}/${p.total_year}` : ''}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
