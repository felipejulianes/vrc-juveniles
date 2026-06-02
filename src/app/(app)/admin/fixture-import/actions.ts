'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseFixtureCSV } from '@/lib/matches/csv-parser'

type ProfileRole = { role: 'admin' | 'coach' | 'tutora' }

async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileData as ProfileRole | null
  if (profile?.role !== 'admin')
    throw new Error('Solo administradores pueden ejecutar esta acción')
  return { supabase, user }
}

type DivisionRow = { id: string; name: string }

export async function confirmFixtureImport(csvText: string): Promise<{ imported: number }> {
  const { supabase, user } = await requireAdmin()

  // Re-parse server-side — do NOT trust client-side parse (T-02-14)
  const result = parseFixtureCSV(csvText)

  if (result.matches.length === 0) {
    throw new Error('No hay partidos válidos para importar')
  }

  // Resolve division_id from division name — only juvenile divisions (T-02-16)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: divisionsData, error: divError } = await (supabase as any)
    .from('divisions')
    .select('id, name')
    .eq('is_juvenile', true)

  if (divError) throw new Error('No se pudieron cargar las divisiones: ' + divError.message)

  const divisions = (divisionsData as DivisionRow[] | null) ?? []
  const divisionMap = new Map<string, string>(divisions.map((d) => [d.name, d.id]))

  const unknownDivisions: string[] = []
  const rows = result.matches.map((m) => {
    const divisionId = divisionMap.get(m.division)
    if (!divisionId) {
      unknownDivisions.push(m.division)
      return null
    }
    return {
      division_id: divisionId,
      match_date: m.fecha,
      match_time: m.hora,
      fecha_nro: m.fecha_nro,
      rival: m.rival,
      home_away: m.local_visitante === 'Local' ? 'local' : 'visitante',
      venue: null,
      subequipo: m.equipo,
      manual: false, // URBA import — must be deletable on next reimport (D-12)
      created_by: user.id,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  // Abort BEFORE any delete if there are unknown divisions (T-02-16, T-02-15)
  if (unknownDivisions.length > 0) {
    throw new Error(
      'Divisiones no encontradas en la base: ' +
        Array.from(new Set(unknownDivisions)).join(', ')
    )
  }

  // Truncate: delete only URBA matches (manual=false) for divisions in this CSV (D-12, T-02-15)
  const divisionIds = Array.from(new Set(rows.map((r) => r.division_id)))
  // Trade-off: delete+insert no es atómico; si el insert falla el admin reintenta el import completo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: delError } = await (supabase as any)
    .from('matches')
    .delete()
    .eq('manual', false)
    .in('division_id', divisionIds)

  if (delError)
    throw new Error('No se pudieron borrar los partidos URBA previos: ' + delError.message)

  // Bulk insert new URBA matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insError } = await (supabase as any).from('matches').insert(rows)

  if (insError)
    throw new Error('No se pudieron insertar los partidos: ' + insError.message)

  revalidatePath('/fixture')
  revalidatePath('/admin/fixture-import')

  return { imported: rows.length }
}
