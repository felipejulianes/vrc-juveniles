import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PositionRow = Database['public']['Tables']['player_positions']['Row']

type RawPosition = Pick<PositionRow, 'position_primary' | 'position_alt1' | 'position_alt2'>

export type PlayerWithPosition = PlayerRow & {
  player_positions: RawPosition | null
}

// Supabase may return the FK relation as an array or object depending on the join type
type RawPlayerWithPositionJoin = PlayerRow & {
  player_positions: RawPosition | RawPosition[] | null
}

function normalizePosition(raw: RawPlayerWithPositionJoin): PlayerWithPosition {
  return {
    ...raw,
    player_positions: Array.isArray(raw.player_positions)
      ? (raw.player_positions[0] ?? null)
      : (raw.player_positions ?? null),
  }
}

export async function listByDivision(divisionId: string): Promise<PlayerWithPosition[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*, player_positions(position_primary, position_alt1, position_alt2)')
    .eq('division_id', divisionId)
    .order('inactivo', { ascending: true })
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((p) => normalizePosition(p as unknown as RawPlayerWithPositionJoin))
}

export async function getById(playerId: string): Promise<PlayerWithPosition | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*, player_positions(position_primary, position_alt1, position_alt2)')
    .eq('id', playerId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return normalizePosition(data as unknown as RawPlayerWithPositionJoin)
}

export async function getNotes(
  playerId: string
): Promise<Database['public']['Tables']['player_notes']['Row'][]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('player_notes')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}
