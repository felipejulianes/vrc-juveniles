'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PlayerFormSchema, type PlayerFormInput } from '@/lib/players/schema'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CoachDivisionRow = Database['public']['Tables']['coach_divisions']['Row']
type PlayerRow = Database['public']['Tables']['players']['Row']
type PlayerPositionsInsert = Database['public']['Tables']['player_positions']['Insert']

// ─── Authorization helpers ────────────────────────────────────────────────────

async function requireCoachForDivision(
  divisionId: string
): Promise<{ userId: string; role: ProfileRow['role'] }> {
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
  if (role === 'admin') return { userId: user.id, role: 'admin' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cdData } = await (supabase as any)
    .from('coach_divisions')
    .select('division_id')
    .eq('coach_id', user.id)
    .eq('division_id', divisionId)
    .maybeSingle()

  if (!cdData) throw new Error('No tenés acceso a esta división')
  return { userId: user.id, role: (role as ProfileRow['role']) ?? 'coach' }
}

async function requireCoachForPlayer(
  playerId: string
): Promise<{ userId: string; role: ProfileRow['role'] }> {
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
  if (role === 'admin') return { userId: user.id, role: 'admin' as const }

  // RLS already enforces this, but explicit check returns a friendlier error:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rowData } = await (supabase as any)
    .from('players')
    .select('division_id')
    .eq('id', playerId)
    .maybeSingle()

  const playerRow = rowData as Pick<PlayerRow, 'division_id'> | null
  if (!playerRow) throw new Error('Jugador no encontrado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cdData } = await (supabase as any)
    .from('coach_divisions')
    .select('division_id')
    .eq('coach_id', user.id)
    .eq('division_id', playerRow.division_id)
    .maybeSingle()

  const cdRow = cdData as Pick<CoachDivisionRow, 'division_id'> | null
  if (!cdRow) throw new Error('No tenés acceso a este jugador')
  return { userId: user.id, role: (role as ProfileRow['role']) ?? 'coach' }
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function createPlayer(input: PlayerFormInput): Promise<{ playerId: string }> {
  const parsed = PlayerFormSchema.parse(input)
  const { userId } = await requireCoachForDivision(parsed.division_id)
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const insertPayload: Database['public']['Tables']['players']['Insert'] = {
    division_id: parsed.division_id,
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    dni: parsed.dni || null,
    birth_date: parsed.birth_date || null,
    parent_phone: parsed.parent_phone || null,
    parent_name: parsed.parent_name || null,
    inactivo: false,
  }

  const { data, error } = await sb.from('players').insert(insertPayload).select('id').single()

  if (error || !data) throw new Error('No se pudo crear el jugador. ' + (error?.message ?? ''))

  const insertedId = (data as Pick<PlayerRow, 'id'>).id

  // Persist positions if provided
  if (parsed.position_primary != null || parsed.position_alt1 != null) {
    const posPayload: PlayerPositionsInsert = {
      player_id: insertedId,
      position_primary: parsed.position_primary ?? null,
      position_alt1: parsed.position_alt1 ?? null,
      updated_by: userId,
    }
    const { error: posErr } = await sb.from('player_positions').upsert(posPayload)
    if (posErr)
      throw new Error('Jugador creado pero las posiciones no se guardaron: ' + posErr.message)
  }

  revalidatePath('/jugadores')
  return { playerId: insertedId }
}

export async function updatePlayer(playerId: string, input: PlayerFormInput): Promise<void> {
  const parsed = PlayerFormSchema.parse(input)
  const { userId } = await requireCoachForPlayer(playerId)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const updatePayload: Database['public']['Tables']['players']['Update'] = {
    first_name: parsed.first_name,
    last_name: parsed.last_name,
    dni: parsed.dni || null,
    birth_date: parsed.birth_date || null,
    parent_phone: parsed.parent_phone || null,
    parent_name: parsed.parent_name || null,
    division_id: parsed.division_id,
  }

  const { error } = await sb.from('players').update(updatePayload).eq('id', playerId)

  if (error)
    throw new Error(
      'No se pudo guardar. Revisá los datos e intentá de nuevo. ' + error.message
    )

  const posPayload: PlayerPositionsInsert = {
    player_id: playerId,
    position_primary: parsed.position_primary ?? null,
    position_alt1: parsed.position_alt1 ?? null,
    updated_by: userId,
  }
  const { error: posErr } = await sb.from('player_positions').upsert(posPayload)
  if (posErr) throw new Error('No se pudieron guardar las posiciones: ' + posErr.message)

  revalidatePath('/jugadores')
  revalidatePath(`/jugadores/${playerId}`)
}

export async function upsertPositions(
  playerId: string,
  primary: number | null,
  alt1: number | null
): Promise<void> {
  if (primary != null && (primary < 1 || primary > 15)) throw new Error('Puesto principal inválido')
  if (alt1 != null && (alt1 < 1 || alt1 > 15)) throw new Error('Puesto alternativo inválido')

  const { userId } = await requireCoachForPlayer(playerId)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const posPayload: PlayerPositionsInsert = {
    player_id: playerId,
    position_primary: primary,
    position_alt1: alt1,
    updated_by: userId,
  }
  const { error } = await sb.from('player_positions').upsert(posPayload)
  if (error) throw new Error('No se pudieron guardar las posiciones: ' + error.message)
  revalidatePath(`/jugadores/${playerId}`)
}

export async function softDeletePlayer(playerId: string): Promise<void> {
  await requireCoachForPlayer(playerId)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Soft-delete: sets inactivo=true — hard delete is intentionally NOT used
  // PLY-06 contract: inactive players stay queryable, sorted to bottom of list
  const updatePayload: Database['public']['Tables']['players']['Update'] = { inactivo: true }
  const { error } = await sb.from('players').update(updatePayload).eq('id', playerId)

  if (error) throw new Error('No se pudo eliminar el jugador: ' + error.message)

  revalidatePath('/jugadores')
  revalidatePath(`/jugadores/${playerId}`)
}

export async function setPlayerPhotoUrl(playerId: string, photoUrl: string): Promise<void> {
  await requireCoachForPlayer(playerId)
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const updatePayload: Database['public']['Tables']['players']['Update'] = { photo_url: photoUrl }
  const { error } = await sb.from('players').update(updatePayload).eq('id', playerId)

  if (error) throw new Error('No se pudo asociar la foto: ' + error.message)
  revalidatePath(`/jugadores/${playerId}`)
}
