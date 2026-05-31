'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MatchFormSchema, type MatchFormInput } from '@/lib/matches/schema'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MatchRow = Database['public']['Tables']['matches']['Row']

async function requireAdminOrCoachForDivision(
  divisionId: string
): Promise<{ userId: string; role: 'admin' | 'coach' | 'tutora' }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()

  const role = ((profileData as Pick<ProfileRow, 'role'> | null)?.role ?? 'coach') as 'admin' | 'coach' | 'tutora'
  if (role === 'admin') return { userId: user.id, role: 'admin' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cdData } = await (supabase as any)
    .from('coach_divisions').select('division_id')
    .eq('coach_id', user.id).eq('division_id', divisionId).maybeSingle()

  if (!cdData) throw new Error('No tenes acceso a esta division')
  return { userId: user.id, role }
}

async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  const role = (data as Pick<ProfileRow, 'role'> | null)?.role
  if (role !== 'admin') throw new Error('Solo admin puede realizar esta accion')
  return { userId: user.id }
}

async function requireAdminOrCoachForMatch(matchId: string): Promise<{ userId: string; role: 'admin' | 'coach' | 'tutora'; match: Pick<MatchRow, 'division_id' | 'manual'> }> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mData } = await (supabase as any)
    .from('matches').select('division_id, manual').eq('id', matchId).maybeSingle()
  if (!mData) throw new Error('Partido no encontrado')
  const match = mData as Pick<MatchRow, 'division_id' | 'manual'>
  const { userId, role } = await requireAdminOrCoachForDivision(match.division_id)
  return { userId, role, match }
}

export async function createMatch(input: MatchFormInput): Promise<{ matchId: string }> {
  const parsed = MatchFormSchema.parse(input)
  const { userId } = await requireAdminOrCoachForDivision(parsed.division_id)
  const supabase = createClient()

  const insertPayload: Database['public']['Tables']['matches']['Insert'] = {
    division_id: parsed.division_id,
    match_date: parsed.match_date,
    match_time: parsed.match_time || null,
    fecha_nro: parsed.fecha_nro ?? null,
    rival: parsed.rival,
    home_away: parsed.home_away,
    venue: parsed.venue || null,
    subequipo: parsed.subequipo || null,
    manual: true, // Manually created: preserved during URBA reimport (D-12)
    created_by: userId,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('matches').insert(insertPayload).select('id').single()
  if (error || !data) throw new Error('No se pudo crear el partido. ' + (error?.message ?? ''))

  const insertedId = (data as { id: string }).id
  revalidatePath('/fixture')
  return { matchId: insertedId }
}

export async function updateMatch(matchId: string, input: MatchFormInput): Promise<void> {
  const parsed = MatchFormSchema.parse(input)
  const { role, match } = await requireAdminOrCoachForMatch(matchId)

  // Coach cannot move a match to a different division.
  if (role !== 'admin' && parsed.division_id !== match.division_id) {
    throw new Error('No podes cambiar la division del partido')
  }

  const updatePayload: Database['public']['Tables']['matches']['Update'] = {
    division_id: parsed.division_id,
    match_date: parsed.match_date,
    match_time: parsed.match_time || null,
    fecha_nro: parsed.fecha_nro ?? null,
    rival: parsed.rival,
    home_away: parsed.home_away,
    venue: parsed.venue || null,
    subequipo: parsed.subequipo || null,
  }

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('matches').update(updatePayload).eq('id', matchId)
  if (error) throw new Error('No se pudo guardar el partido: ' + error.message)

  revalidatePath('/fixture')
  revalidatePath(`/fixture/${matchId}`)
}

export async function deleteMatch(matchId: string): Promise<void> {
  await requireAdmin()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('matches').delete().eq('id', matchId)
  if (error) throw new Error('No se pudo eliminar el partido: ' + error.message)
  revalidatePath('/fixture')
}
