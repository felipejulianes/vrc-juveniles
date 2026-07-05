import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getJuvenileDivisionsForUser } from '@/lib/queries/divisions'
import {
  getDivisionKpis,
  getSessionTrend,
  getStatsByDays,
  getStatsByYear,
} from '@/lib/queries/stats'
import {
  StatsShell,
  type DivisionStatsData,
  type PlayerStatRow,
} from '@/components/stats/StatsShell'

export default async function EstadisticaPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { divisions } = await getJuvenileDivisionsForUser()

  const dataByDivision: Record<string, DivisionStatsData> = {}

  await Promise.all(
    divisions.map(async (div) => {
      try {
        const [kpis, trend, yearStats, daysStats] = await Promise.all([
          getDivisionKpis(div.id),
          getSessionTrend(div.id, 10),
          getStatsByYear(div.id),
          getStatsByDays(div.id, 30),
        ])

        const daysById = new Map(daysStats.map((s) => [s.player_id, s]))
        const players: PlayerStatRow[] = yearStats.map((y) => {
          const d = daysById.get(y.player_id)
          return {
            player_id: y.player_id,
            first_name: y.first_name,
            last_name: y.last_name,
            photo_url: y.photo_url,
            pct_year: y.attendance_pct,
            present_year: y.sessions_present,
            total_year: y.total_sessions,
            pct_30d: d?.attendance_pct ?? null,
            present_30d: d?.sessions_present ?? 0,
            total_30d: d?.total_sessions ?? 0,
          }
        })

        dataByDivision[div.id] = { kpis, trend, players }
      } catch {
        dataByDivision[div.id] = { kpis: null, trend: [], players: [] }
      }
    })
  )

  return <StatsShell dataByDivision={dataByDivision} />
}
