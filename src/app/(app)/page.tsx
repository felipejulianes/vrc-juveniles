import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getJuvenileDivisionsForUser } from '@/lib/queries/divisions'
import { listByDivision as listMatchesByDivision } from '@/lib/queries/matches'
import { listSessionsByDivision } from '@/lib/queries/attendance'
import { getDivisionKpis } from '@/lib/queries/stats'
import { HomeDashboard, type HomeDivisionData } from '@/components/home/HomeDashboard'

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { divisions } = await getJuvenileDivisionsForUser()
  const today = new Date().toISOString().split('T')[0]

  const dataByDivision: Record<string, HomeDivisionData> = {}

  await Promise.all(
    divisions.map(async (div) => {
      try {
        const [matches, sessions, kpis] = await Promise.all([
          listMatchesByDivision(div.id),
          listSessionsByDivision(div.id),
          getDivisionKpis(div.id),
        ])

        const nextMatch =
          matches.find((m) => m.match_date >= today) ?? null
        const pastSessions = sessions.filter((s) => s.session_date <= today)
        const lastSession = pastSessions[0] ?? null

        dataByDivision[div.id] = {
          nextMatch: nextMatch
            ? {
                id: nextMatch.id,
                rival: nextMatch.rival,
                match_date: nextMatch.match_date,
                match_time: nextMatch.match_time,
                home_away: nextMatch.home_away as 'local' | 'visitante',
                venue: nextMatch.venue,
                fecha_nro: nextMatch.fecha_nro,
                subequipo: nextMatch.subequipo,
              }
            : null,
          lastSession: lastSession
            ? {
                id: lastSession.id,
                session_date: lastSession.session_date,
                present_count: lastSession.present_count,
              }
            : null,
          kpis,
        }
      } catch {
        dataByDivision[div.id] = { nextMatch: null, lastSession: null, kpis: null }
      }
    })
  )

  return <HomeDashboard dataByDivision={dataByDivision} />
}
