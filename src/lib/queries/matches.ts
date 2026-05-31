import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type MatchRow = Database['public']['Tables']['matches']['Row']
type ScoringEventRow = Database['public']['Tables']['match_scoring_events']['Row']

export type MatchWithDivision = MatchRow & {
  divisions: { name: string } | null
}

export type MatchWithEvents = MatchRow & {
  match_scoring_events: ScoringEventRow[]
}

export async function listByDivision(divisionId: string): Promise<MatchRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('division_id', divisionId)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as MatchRow[]
}

export async function listAllJuvenile(): Promise<MatchWithDivision[]> {
  const supabase = createClient()
  // Join divisions; filter to is_juvenile via divisions FK
  const { data, error } = await supabase
    .from('matches')
    .select('*, divisions!inner(name, is_juvenile)')
    .eq('divisions.is_juvenile', true)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as MatchWithDivision[]
}

export async function getById(matchId: string): Promise<MatchRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle()
  if (error) throw error
  return (data as MatchRow) ?? null
}

export async function getWithEvents(matchId: string): Promise<MatchWithEvents | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*, match_scoring_events(*)')
    .eq('id', matchId)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as MatchWithEvents) ?? null
}
