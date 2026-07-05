import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type JuvenileDivision = { id: string; name: string }

/**
 * Divisiones juveniles visibles para el usuario actual:
 * admin ve todas, coach solo las asignadas en coach_divisions.
 */
export async function getJuvenileDivisionsForUser(): Promise<{
  role: 'admin' | 'coach' | 'tutora'
  divisions: JuvenileDivision[]
}> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { role: 'coach', divisions: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = ((profileData as { role?: string } | null)?.role ?? 'coach') as
    | 'admin'
    | 'coach'
    | 'tutora'

  if (role === 'admin' || role === 'tutora') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('divisions')
      .select('id, name')
      .eq('is_juvenile', true)
      .order('name')
    return { role, divisions: (data as JuvenileDivision[] | null) ?? [] }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cdData } = await (supabase as any)
    .from('coach_divisions')
    .select('division_id')
    .eq('coach_id', user.id)
  const ids = ((cdData as { division_id: string }[] | null) ?? []).map(
    (r) => r.division_id
  )
  if (ids.length === 0) return { role, divisions: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('divisions')
    .select('id, name')
    .eq('is_juvenile', true)
    .in('id', ids)
    .order('name')
  return { role, divisions: (data as JuvenileDivision[] | null) ?? [] }
}
