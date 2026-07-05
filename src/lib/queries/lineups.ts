import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type LineupEntry = {
  slot: number
  player_id: string
}

export async function getLineup(matchId: string): Promise<LineupEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_lineups')
    .select('slot, player_id')
    .eq('match_id', matchId)
    .order('slot', { ascending: true })
  if (error) {
    // Tabla puede no existir aún (migración pendiente) — degradar a vacío
    return []
  }
  return (data ?? []) as LineupEntry[]
}
