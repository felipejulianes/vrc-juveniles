import { createClient } from '@/lib/supabase/server'
import { listByDivision } from '@/lib/queries/players'
import { PlayerListClient } from '@/components/players/PlayerListClient'
import type { PlayerWithPosition } from '@/lib/queries/players'

export default async function JugadoresPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch profile to determine role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { id: string; role: 'admin' | 'coach' | 'tutora' } | null

  // Determine juvenile divisions for this user
  let juvenileDivisions: { id: string; name: string }[] = []

  if (profile?.role === 'admin') {
    const { data: allJuvData } = await supabase
      .from('divisions')
      .select('id, name')
      .eq('is_juvenile', true)
      .order('name')
    juvenileDivisions = (allJuvData as { id: string; name: string }[] | null) ?? []
  } else {
    const { data: cdData } = await supabase
      .from('coach_divisions')
      .select('division_id')
      .eq('coach_id', user.id)

    const coachDivisionIds = (cdData as { division_id: string }[] | null)?.map(
      (r) => r.division_id
    ) ?? []

    if (coachDivisionIds.length > 0) {
      const { data: divsData } = await supabase
        .from('divisions')
        .select('id, name')
        .eq('is_juvenile', true)
        .in('id', coachDivisionIds)
        .order('name')
      juvenileDivisions = (divsData as { id: string; name: string }[] | null) ?? []
    }
  }

  // Pre-fetch players for all divisions in parallel
  const playersByDivision: Record<string, PlayerWithPosition[]> = {}

  if (juvenileDivisions.length > 0) {
    const results = await Promise.all(
      juvenileDivisions.map(async (div) => ({
        divisionId: div.id,
        players: await listByDivision(div.id),
      }))
    )
    for (const { divisionId, players } of results) {
      playersByDivision[divisionId] = players
    }
  }

  return (
    <div>
      <div className="px-4 py-3">
        <h1 className="text-xl font-semibold">Jugadores</h1>
      </div>
      <PlayerListClient initialPlayersByDivision={playersByDivision} />
    </div>
  )
}
