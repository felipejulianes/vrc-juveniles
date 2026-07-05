import 'server-only'
import { createClient } from '@/lib/supabase/server'

// Juveniles solo mide entrenamientos; las sesiones 'sabado'/'miercoles' que
// infantiles pre-creó en divisiones M15-M19 quedan excluidas siempre.
const SESSION_TYPE = 'entrenamiento'

export type PlayerStat = {
  player_id: string
  first_name: string
  last_name: string
  photo_url: string | null
  total_sessions: number
  sessions_present: number
  attendance_pct: number | null
}

type RawStat = PlayerStat & { parent_name?: string | null; parent_phone?: string | null }

function mapStat(r: RawStat): PlayerStat {
  return {
    player_id: r.player_id,
    first_name: r.first_name,
    last_name: r.last_name,
    photo_url: r.photo_url,
    total_sessions: Number(r.total_sessions),
    sessions_present: Number(r.sessions_present),
    attendance_pct: r.attendance_pct !== null ? Number(r.attendance_pct) : null,
  }
}

export async function getStatsByDays(divisionId: string, days = 30): Promise<PlayerStat[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_attendance_stats_days', {
    p_division_id: divisionId,
    p_days: days,
    p_session_type: SESSION_TYPE,
  })
  if (error) return []
  return ((data ?? []) as RawStat[]).map(mapStat)
}

export async function getStatsByYear(divisionId: string, year?: number): Promise<PlayerStat[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_attendance_stats_year', {
    p_division_id: divisionId,
    ...(year !== undefined ? { p_year: year } : {}),
    p_session_type: SESSION_TYPE,
  })
  if (error) return []
  return ((data ?? []) as RawStat[]).map(mapStat)
}

// ── Tendencia por sesión ────────────────────────────────────

export type SessionTrendPoint = {
  session_id: string
  session_date: string
  present_count: number
  total_count: number
}

export async function getSessionTrend(
  divisionId: string,
  limit = 10
): Promise<SessionTrendPoint[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('id, session_date')
    .eq('division_id', divisionId)
    .eq('session_type', SESSION_TYPE)
    .lte('session_date', today)
    .order('session_date', { ascending: false })
    .limit(limit)

  if (!sessions || sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id)
  const { data: records } = await supabase
    .from('attendance_records')
    .select('session_id, present')
    .in('session_id', sessionIds)

  const countMap: Record<string, { present: number; total: number }> = {}
  for (const s of sessions) countMap[s.id] = { present: 0, total: 0 }
  for (const r of records ?? []) {
    const c = countMap[r.session_id]
    if (c) {
      c.total++
      if (r.present) c.present++
    }
  }

  // Cronológico (viejo → nuevo) para graficar
  return sessions
    .map((s) => ({
      session_id: s.id,
      session_date: s.session_date,
      present_count: countMap[s.id].present,
      total_count: countMap[s.id].total,
    }))
    .reverse()
}

// ── KPIs de división ────────────────────────────────────────

export type DivisionKpis = {
  activePlayers: number
  sessions30d: number
  avgPresent30d: number // promedio de presentes por entrenamiento (últimos 30 días)
  pct30d: number | null // presentes/registros en los últimos 30 días
}

export async function getDivisionKpis(divisionId: string): Promise<DivisionKpis> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [{ count: activePlayers }, sessionsRes] = await Promise.all([
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('division_id', divisionId)
      .eq('active', true)
      .neq('inactivo', true),
    supabase
      .from('training_sessions')
      .select('id')
      .eq('division_id', divisionId)
      .eq('session_type', SESSION_TYPE)
      .gte('session_date', cutoff)
      .lte('session_date', today),
  ])

  const sessionIds = (sessionsRes.data ?? []).map((s) => s.id)
  let avgPresent30d = 0
  let pct30d: number | null = null

  if (sessionIds.length > 0) {
    const { data: records } = await supabase
      .from('attendance_records')
      .select('session_id, present')
      .in('session_id', sessionIds)

    const present = (records ?? []).filter((r) => r.present).length
    const total = (records ?? []).length
    avgPresent30d = Math.round(present / sessionIds.length)
    pct30d = total > 0 ? Math.round((present / total) * 100) : null
  }

  return {
    activePlayers: activePlayers ?? 0,
    sessions30d: sessionIds.length,
    avgPresent30d,
    pct30d,
  }
}

// ── Asistencia reciente por jugador (para Team Builder) ─────

export type RecentAttendance = {
  present: number
  total: number
  attendedLast: boolean // vino al último entrenamiento
}

export async function getRecentAttendanceByPlayer(
  divisionId: string,
  lastN = 4
): Promise<Record<string, RecentAttendance>> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('id, session_date')
    .eq('division_id', divisionId)
    .eq('session_type', SESSION_TYPE)
    .lte('session_date', today)
    .order('session_date', { ascending: false })
    .limit(lastN)

  if (!sessions || sessions.length === 0) return {}

  const lastSessionId = sessions[0].id
  const sessionIds = sessions.map((s) => s.id)

  const { data: records } = await supabase
    .from('attendance_records')
    .select('session_id, player_id, present')
    .in('session_id', sessionIds)

  const map: Record<string, RecentAttendance> = {}
  for (const r of records ?? []) {
    const entry = (map[r.player_id] ??= { present: 0, total: 0, attendedLast: false })
    entry.total++
    if (r.present) {
      entry.present++
      if (r.session_id === lastSessionId) entry.attendedLast = true
    }
  }
  // total homogéneo: cantidad de sesiones consideradas (aunque el jugador no tenga registro)
  for (const key of Object.keys(map)) map[key].total = sessions.length
  return map
}

export async function countTrainingSessions(divisionId: string, lastN = 4): Promise<number> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('division_id', divisionId)
    .eq('session_type', SESSION_TYPE)
    .lte('session_date', today)
    .order('session_date', { ascending: false })
    .limit(lastN)
  return (data ?? []).length
}
