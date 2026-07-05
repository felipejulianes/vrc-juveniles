'use client'

import Link from 'next/link'
import {
  CalendarDays,
  ClipboardCheck,
  ChevronRight,
  Users,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useDivision, isAllDivisions } from '@/context/DivisionContext'
import { formatMatchDate } from '@/lib/matches/utils'

export type HomeDivisionData = {
  nextMatch: {
    id: string
    rival: string
    match_date: string
    match_time: string | null
    home_away: 'local' | 'visitante'
    venue: string | null
    fecha_nro: number | null
    subequipo: string | null
  } | null
  lastSession: {
    id: string
    session_date: string
    present_count: number
  } | null
  kpis: {
    activePlayers: number
    sessions30d: number
    avgPresent30d: number
    pct30d: number | null
  } | null
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-lg bg-card border border-border px-3 py-2.5">
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  tutora: 'Tutora',
}

export function HomeDashboard({
  dataByDivision,
  sessionInfo,
}: {
  dataByDivision: Record<string, HomeDivisionData>
  sessionInfo?: { fullName: string | null; role: string }
}) {
  const { activeDivision } = useDivision()

  if (!activeDivision || isAllDivisions(activeDivision)) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Elegí una división en el selector de arriba para ver su tablero.
        </p>
      </div>
    )
  }

  const data = dataByDivision[activeDivision.id]
  const nextMatch = data?.nextMatch ?? null
  const lastSession = data?.lastSession ?? null
  const kpis = data?.kpis ?? null

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto">
      {/* Próximo partido */}
      {nextMatch ? (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Próximo partido
              </span>
              {nextMatch.fecha_nro != null && (
                <span className="text-xs text-muted-foreground">
                  Fecha #{nextMatch.fecha_nro}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">
                vs {nextMatch.rival}
                {nextMatch.subequipo ? ` (${nextMatch.subequipo})` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatMatchDate(nextMatch.match_date)}
                {nextMatch.match_time
                  ? ` · ${nextMatch.match_time.slice(0, 5)}`
                  : ''}{' '}
                · {nextMatch.home_away === 'local' ? 'Local' : 'Visitante'}
                {nextMatch.venue ? ` · ${nextMatch.venue}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/fixture/${nextMatch.id}/equipo`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-semibold"
              >
                <Users className="h-4 w-4" />
                Armar equipo
              </Link>
              <Link
                href={`/fixture/${nextMatch.id}`}
                className="px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold"
              >
                Ver partido
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sin próximos partidos</p>
              <p className="text-xs text-muted-foreground">
                Cargá el fixture o agregá un partido manual.
              </p>
            </div>
            <Link
              href="/fixture"
              className="flex items-center gap-1 text-sm text-[color:var(--primary)] font-semibold shrink-0"
            >
              Fixture <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Acción principal: tomar lista */}
      <Link
        href="/lista/nueva"
        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-semibold"
      >
        <ClipboardCheck className="h-5 w-5" />
        Tomar lista de hoy
      </Link>

      {/* Última lista */}
      {lastSession && (
        <Link href={`/lista/${lastSession.id}`} className="block">
          <Card className="bg-card border-border hover:bg-accent/10 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                  Último entrenamiento
                </p>
                <p className="text-sm font-medium">
                  {formatMatchDate(lastSession.session_date)} ·{' '}
                  {lastSession.present_count} presentes
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* KPIs */}
      {kpis && (
        <div className="flex gap-2">
          <StatTile value={String(kpis.activePlayers)} label="Jugadores" />
          <StatTile
            value={kpis.pct30d !== null ? `${kpis.pct30d}%` : '—'}
            label="Asistencia 30d"
          />
          <StatTile
            value={kpis.sessions30d > 0 ? String(kpis.avgPresent30d) : '—'}
            label="Prom. por entren."
          />
        </div>
      )}

      {/* Atajos */}
      <div className="flex gap-2">
        <Link
          href="/fixture"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
        >
          <CalendarDays className="h-4 w-4" /> Fixture
        </Link>
        <Link
          href="/estadistica"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
        >
          <BarChart3 className="h-4 w-4" /> Estadística
        </Link>
      </div>

      {/* Identidad de sesión */}
      {sessionInfo && (
        <p className="text-center text-xs text-muted-foreground pt-2">
          Sesión: {sessionInfo.fullName ?? '—'} ·{' '}
          {ROLE_LABELS[sessionInfo.role] ?? sessionInfo.role}
        </p>
      )}
    </div>
  )
}
