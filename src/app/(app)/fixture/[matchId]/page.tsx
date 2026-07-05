import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getLineup } from '@/lib/queries/lineups'
import { getWithEvents } from '@/lib/queries/matches'
import { listByDivision as listPlayersByDivision } from '@/lib/queries/players'
import { MatchDetailHeader } from '@/components/fixture/MatchDetailHeader'
import { ResultEditor } from '@/components/fixture/ResultEditor'
import { ScoringSection } from '@/components/fixture/ScoringSection'
import { MatchAdminBar } from '@/components/fixture/MatchAdminBar'

export default async function MatchDetailPage({
  params,
}: {
  params: { matchId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = (profileData?.role ?? 'coach') as 'admin' | 'coach' | 'tutora'
  const isAdmin = role === 'admin'

  // getWithEvents goes through RLS, which already restricts to admin or coach_divisions.
  // If RLS hides the match (or it does not exist), getWithEvents returns null -> notFound.
  const match = await getWithEvents(params.matchId)
  if (!match) notFound()

  const lineup = await getLineup(match.id)
  const starterCount = lineup.filter((e) => e.slot <= 15).length

  // Player roster of the match's division (active players only)
  const playersRaw = await listPlayersByDivision(match.division_id)
  const players = playersRaw
    .filter((p) => !p.inactivo)
    .map((p) => ({
      id: p.id,
      label: `${p.last_name}, ${p.first_name}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es-AR'))

  type ScoringEventForUI = {
    id: string
    team: 'home' | 'away'
    event_type: 'try' | 'conversion' | 'penalty' | 'drop' | 'yellow_card' | 'red_card'
    player_id: string | null
    rival_scorer: string | null
  }

  const events = (match.match_scoring_events ?? []) as ScoringEventForUI[]

  return (
    <div className="px-4 pt-4 pb-24 space-y-6 max-w-2xl mx-auto">
      <MatchDetailHeader
        match={{
          id: match.id,
          rival: match.rival,
          match_date: match.match_date,
          match_time: match.match_time,
          home_away: match.home_away as 'local' | 'visitante',
          venue: match.venue,
          subequipo: match.subequipo,
          fecha_nro: match.fecha_nro,
        }}
      />

      <Link
        href={`/fixture/${match.id}/equipo`}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-semibold"
      >
        <span className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {starterCount > 0 ? 'Ver / editar equipo' : 'Armar equipo'}
        </span>
        {starterCount > 0 && (
          <span className="text-sm font-normal opacity-90">
            {starterCount}/15 titulares
          </span>
        )}
      </Link>

      <ResultEditor
        matchId={match.id}
        rivalName={match.rival}
        initialScoreHome={match.score_home}
        initialScoreAway={match.score_away}
      />

      <ScoringSection
        matchId={match.id}
        rivalName={match.rival}
        players={players}
        events={events}
      />

      {isAdmin && (
        <MatchAdminBar
          match={{
            id: match.id,
            division_id: match.division_id,
            match_date: match.match_date,
            match_time: match.match_time,
            fecha_nro: match.fecha_nro,
            rival: match.rival,
            home_away: match.home_away as 'local' | 'visitante',
            venue: match.venue,
            subequipo: match.subequipo,
          }}
          matchLabel={`${match.rival} - ${match.match_date}`}
        />
      )}
    </div>
  )
}
