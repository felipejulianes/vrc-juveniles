'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SessionFormSchema, type SessionFormInput } from '@/lib/attendance/schema'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

async function requireCoachForDivision(
  divisionId: string
): Promise<{ userId: string }> {
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

  const role = (profileData as Pick<ProfileRow, 'role'> | null)?.role
  if (role === 'admin') return { userId: user.id }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cd } = await (supabase as any)
    .from('coach_divisions')
    .select('division_id')
    .eq('coach_id', user.id)
    .eq('division_id', divisionId)
    .maybeSingle()

  if (!cd) throw new Error('No tenés acceso a esta división')
  return { userId: user.id }
}

async function requireCoachForSession(
  sessionId: string
): Promise<{ userId: string; divisionId: string }> {
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

  const role = (profileData as Pick<ProfileRow, 'role'> | null)?.role

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from('training_sessions')
    .select('id, division_id')
    .eq('id', sessionId)
    .maybeSingle()

  const session = row as { id: string; division_id: string } | null
  if (!session) throw new Error('Sesión no encontrada')

  if (role === 'admin') {
    return { userId: user.id, divisionId: session.division_id }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cd } = await (supabase as any)
    .from('coach_divisions')
    .select('division_id')
    .eq('coach_id', user.id)
    .eq('division_id', session.division_id)
    .maybeSingle()

  if (!cd) throw new Error('No tenés acceso a esta sesión')
  return { userId: user.id, divisionId: session.division_id }
}

export async function createSession(
  input: SessionFormInput
): Promise<{ sessionId: string }> {
  const parsed = SessionFormSchema.parse(input)
  const { userId } = await requireCoachForDivision(parsed.division_id)
  const supabase = createClient()

  // Check for existing session same day same division — return it instead of creating duplicate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('training_sessions')
    .select('id')
    .eq('division_id', parsed.division_id)
    .eq('session_date', parsed.session_date)
    .eq('session_type', 'entrenamiento')
    .maybeSingle()

  if (existing) {
    revalidatePath('/lista')
    return { sessionId: (existing as { id: string }).id }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('training_sessions')
    .insert({
      division_id: parsed.division_id,
      session_date: parsed.session_date,
      session_type: 'entrenamiento',
      created_by: userId,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error('No se pudo crear la sesión: ' + ((error as { message?: string } | null)?.message ?? ''))
  }

  revalidatePath('/lista')
  return { sessionId: (data as { id: string }).id }
}

export async function upsertAttendance(
  sessionId: string,
  playerId: string,
  present: boolean
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId } = await requireCoachForSession(sessionId)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('attendance_records').upsert(
    {
      session_id: sessionId,
      player_id: playerId,
      present,
    },
    { onConflict: 'session_id,player_id' }
  )
  if (error)
    throw new Error(
      'No se pudo guardar la asistencia: ' + (error as { message: string }).message
    )
  revalidatePath(`/lista/${sessionId}`)
}

export async function batchUpsertAttendance(
  sessionId: string,
  items: { playerId: string; present: boolean }[]
): Promise<void> {
  if (items.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId } = await requireCoachForSession(sessionId)
  const supabase = createClient()
  const rows = items.map((i) => ({
    session_id: sessionId,
    player_id: i.playerId,
    present: i.present,
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('attendance_records')
    .upsert(rows, { onConflict: 'session_id,player_id' })
  if (error) {
    throw new Error(
      'No se pudo guardar la asistencia (batch): ' +
        (error as { message: string }).message
    )
  }
  revalidatePath(`/lista/${sessionId}`)
}
