import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type PlayerRow = Database['public']['Tables']['players']['Row']
type PositionRow = Database['public']['Tables']['player_positions']['Row']

export type PlayerWithPosition = PlayerRow & {
  player_positions: Pick<PositionRow, 'position_primary' | 'position_alt1' | 'position_alt2'> | null
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
  // Supabase returns related row as object or array depending on FK; normalize:
  return (data ?? []).map((p: any) => ({
    ...p,
    player_positions: Array.isArray(p.player_positions)
      ? (p.player_positions[0] ?? null)
      : (p.player_positions ?? null),
  }))
}

export async function getById(playerId: string): Promise<PlayerWithPosition | null> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('players')
    .select('*, player_positions(position_primary, position_alt1, position_alt2)')
    .eq('id', playerId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const raw = data as any
  const normalized: PlayerWithPosition = {
    ...raw,
    player_positions: Array.isArray(raw.player_positions)
      ? (raw.player_positions[0] ?? null)
      : (raw.player_positions ?? null),
  }
  return normalized
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
