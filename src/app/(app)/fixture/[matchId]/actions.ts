'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  MatchResultSchema,
  ScoringEventSchema,
  type MatchResultInput,
  type ScoringEventInput,
} from '@/lib/matches/schema'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MatchRow = Database['public']['Tables']['matches']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']

async function requireAdminOrCoachForMatch(
  matchId: string
): Promise<{ userId: string; role: 'admin' | 'coach' | 'tutora'; matchDivisionId: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = (
    (profileData as Pick<ProfileRow, 'role'> | null)?.role ?? 'coach'
  ) as 'admin' | 'coach' | 'tutora'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mData } = await (supabase as any)
    .from('matches')
    .select('division_id')
    .eq('id', matchId)
    .maybeSingle()
  if (!mData) throw new Error('Partido no encontrado')
  const matchDivisionId = (mData as Pick<MatchRow, 'division_id'>).division_id

  if (role === 'admin') return { userId: user.id, role, matchDivisionId }

  // tutora is read-only: cannot save results or modify scoring events.
  if (role === 'tutora') throw new Error('Las tutoras no pueden modificar el fixture')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cdData } = await (supabase as any)
    .from('coach_divisions')
    .select('division_id')
    .eq('coach_id', user.id)
    .eq('division_id', matchDivisionId)
    .maybeSingle()
  if (!cdData) throw new Error('No tenes acceso a este partido')

  return { userId: user.id, role, matchDivisionId }
}

export async function saveResult(matchId: string, input: MatchResultInput): Promise<void> {
  const parsed = MatchResultSchema.parse(input)
  await requireAdminOrCoachForMatch(matchId)
  const supabase = createClient()

  const updatePayload: Database['public']['Tables']['matches']['Update'] = {
    score_home: parsed.score_home,
    score_away: parsed.score_away,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('matches')
    .update(updatePayload)
    .eq('id', matchId)
  if (error) throw new Error('No se pudo guardar el resultado: ' + error.message)

  revalidatePath('/fixture')
  revalidatePath(`/fixture/${matchId}`)
}

export async function addScoringEvent(input: ScoringEventInput): Promise<{ eventId: string }> {
  const parsed = ScoringEventSchema.parse(input)
  const { matchDivisionId } = await requireAdminOrCoachForMatch(parsed.match_id)
  const supabase = createClient()

  // If player_id is provided AND team === 'home', validate player belongs to match's division.
  if (parsed.team === 'home' && parsed.player_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: playerData } = await (supabase as any)
      .from('players')
      .select('division_id')
      .eq('id', parsed.player_id)
      .maybeSingle()
    const player = playerData as Pick<PlayerRow, 'division_id'> | null
    if (!player) throw new Error('Jugador no encontrado')
    if (player.division_id !== matchDivisionId) {
      throw new Error('El jugador no pertenece a la division del partido')
    }
  }

  // Away team uses rival_scorer (free text), not player_id.
  const insertPayload: Database['public']['Tables']['match_scoring_events']['Insert'] = {
    match_id: parsed.match_id,
    team: parsed.team,
    event_type: parsed.event_type,
    player_id: parsed.team === 'home' ? (parsed.player_id ?? null) : null,
    rival_scorer: parsed.team === 'away' ? (parsed.rival_scorer ?? null) : null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('match_scoring_events')
    .insert(insertPayload)
    .select('id')
    .single()
  if (error || !data) throw new Error('No se pudo agregar el evento: ' + (error?.message ?? ''))

  revalidatePath(`/fixture/${parsed.match_id}`)
  return { eventId: (data as { id: string }).id }
}

export async function deleteScoringEvent(eventId: string, matchId: string): Promise<void> {
  await requireAdminOrCoachForMatch(matchId)
  const supabase = createClient()
  // Scope DELETE to both eventId AND matchId to prevent cross-match deletion
  // and ensure cache revalidation always matches what was actually deleted.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('match_scoring_events')
    .delete()
    .eq('id', eventId)
    .eq('match_id', matchId)
  if (error) throw new Error('No se pudo borrar el evento: ' + error.message)
  revalidatePath(`/fixture/${matchId}`)
}
