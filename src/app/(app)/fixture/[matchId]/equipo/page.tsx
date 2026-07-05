import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getById } from '@/lib/queries/matches'
import { listByDivision as listPlayersByDivision } from '@/lib/queries/players'
import { getRecentAttendanceByPlayer } from '@/lib/queries/stats'
import { getLineup } from '@/lib/queries/lineups'
import { TeamBuilder } from '@/components/lineup/TeamBuilder'

export default async function TeamBuilderPage({
  params,
}: {
  params: { matchId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS restringe el partido a admin o coach de la división
  const match = await getById(params.matchId)
  if (!match) notFound()

  const [playersRaw, recentAttendance, lineup] = await Promise.all([
    listPlayersByDivision(match.division_id),
    getRecentAttendanceByPlayer(match.division_id, 4),
    getLineup(params.matchId),
  ])

  const players = playersRaw
    .filter((p) => !p.inactivo && p.active !== false)
    .map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      photo_url: p.photo_url,
      apto_medico: (p as { apto_medico?: boolean }).apto_medico ?? false,
      position_primary: p.player_positions?.position_primary ?? null,
      position_alt1: p.player_positions?.position_alt1 ?? null,
      position_alt2: p.player_positions?.position_alt2 ?? null,
      attendance: recentAttendance[p.id] ?? null,
    }))

  return (
    <TeamBuilder
      match={{
        id: match.id,
        rival: match.rival,
        match_date: match.match_date,
        match_time: match.match_time,
        home_away: match.home_away as 'local' | 'visitante',
        subequipo: match.subequipo,
      }}
      players={players}
      initialLineup={lineup}
    />
  )
}
