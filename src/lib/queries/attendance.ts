import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type SessionRow = Database['public']['Tables']['training_sessions']['Row']
type AttendanceRow = Database['public']['Tables']['attendance_records']['Row']

export type SessionWithCount = SessionRow & { present_count: number }

export async function listSessionsByDivision(
  divisionId: string
): Promise<SessionWithCount[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, attendance_records(player_id, present)')
    .eq('division_id', divisionId)
    .eq('session_type', 'entrenamiento')
    .order('session_date', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((s: unknown) => {
    const session = s as SessionRow & {
      attendance_records: { player_id: string; present: boolean }[]
    }
    return {
      ...session,
      present_count: (session.attendance_records ?? []).filter(
        (r) => r.present
      ).length,
      attendance_records: undefined,
    } as SessionWithCount
  })
}

export async function getSession(sessionId: string): Promise<SessionRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getRecordsForSession(
  sessionId: string
): Promise<AttendanceRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', sessionId)
  if (error) throw error
  return data ?? []
}
