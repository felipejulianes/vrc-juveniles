'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LineupSchema = z
  .array(
    z.object({
      slot: z.number().int().min(1).max(23),
      player_id: z.string().uuid(),
    })
  )
  .max(23)
  .refine(
    (entries) => new Set(entries.map((e) => e.slot)).size === entries.length,
    'Slots duplicados'
  )
  .refine(
    (entries) => new Set(entries.map((e) => e.player_id)).size === entries.length,
    'Jugadores duplicados'
  )

async function requireCoachForMatch(
  matchId: string
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
  const role = (profileData as { role?: string } | null)?.role
  if (role === 'tutora') throw new Error('No autorizado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matchData } = await (supabase as any)
    .from('matches')
    .select('id, division_id')
    .eq('id', matchId)
    .maybeSingle()
  const match = matchData as { id: string; division_id: string } | null
  if (!match) throw new Error('Partido no encontrado')

  if (role !== 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cd } = await (supabase as any)
      .from('coach_divisions')
      .select('division_id')
      .eq('coach_id', user.id)
      .eq('division_id', match.division_id)
      .maybeSingle()
    if (!cd) throw new Error('No tenés acceso a este partido')
  }

  return { userId: user.id, divisionId: match.division_id }
}

export async function saveLineup(
  matchId: string,
  entries: { slot: number; player_id: string }[]
): Promise<void> {
  const parsed = LineupSchema.parse(entries)
  const { userId, divisionId } = await requireCoachForMatch(matchId)
  const supabase = createClient()

  // Todos los jugadores deben pertenecer a la división del partido
  if (parsed.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: playersData } = await (supabase as any)
      .from('players')
      .select('id')
      .eq('division_id', divisionId)
      .in('id', parsed.map((e) => e.player_id))
    const validIds = new Set(((playersData as { id: string }[] | null) ?? []).map((p) => p.id))
    const invalid = parsed.filter((e) => !validIds.has(e.player_id))
    if (invalid.length > 0) {
      throw new Error('Hay jugadores que no pertenecen a la división del partido')
    }
  }

  // Reemplazo total: delete + insert (la formación completa viaja en cada guardado)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: delError } = await (supabase as any)
    .from('match_lineups')
    .delete()
    .eq('match_id', matchId)
  if (delError) {
    throw new Error('No se pudo actualizar la formación: ' + delError.message)
  }

  if (parsed.length > 0) {
    const rows = parsed.map((e) => ({
      match_id: matchId,
      slot: e.slot,
      player_id: e.player_id,
      updated_by: userId,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insError } = await (supabase as any)
      .from('match_lineups')
      .insert(rows)
    if (insError) {
      throw new Error('No se pudo guardar la formación: ' + insError.message)
    }
  }

  revalidatePath(`/fixture/${matchId}/equipo`)
  revalidatePath(`/fixture/${matchId}`)
}
