import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listSessionsByDivision, type SessionWithCount } from '@/lib/queries/attendance'
import { SessionList } from '@/components/attendance/SessionList'
import { PageHeader } from '@/components/layout/PageHeader'

export default async function ListaPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null

  // Fetch juvenile divisions for this coach / admin
  let juvenileDivisions: { id: string; name: string }[] = []

  if (profile?.role === 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allDivs } = await (supabase as any)
      .from('divisions')
      .select('id, name')
      .eq('is_juvenile', true)
      .order('name')
    juvenileDivisions = (allDivs as { id: string; name: string }[] | null) ?? []
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cdData } = await (supabase as any)
      .from('coach_divisions')
      .select('division_id')
      .eq('coach_id', user.id)

    const coachDivisionIds =
      (cdData as { division_id: string }[] | null)?.map((r) => r.division_id) ?? []

    if (coachDivisionIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: divsData } = await (supabase as any)
        .from('divisions')
        .select('id, name')
        .eq('is_juvenile', true)
        .in('id', coachDivisionIds)
        .order('name')
      juvenileDivisions = (divsData as { id: string; name: string }[] | null) ?? []
    }
  }

  // Fetch sessions for all juvenile divisions in parallel
  const sessionsByDivision: Record<string, SessionWithCount[]> = {}

  await Promise.all(
    juvenileDivisions.map(async (div) => {
      try {
        sessionsByDivision[div.id] = await listSessionsByDivision(div.id)
      } catch {
        sessionsByDivision[div.id] = []
      }
    })
  )

  return (
    <div>
      <PageHeader title="Lista" subtitle="Asistencia a entrenamientos" />
      <SessionList sessionsByDivision={sessionsByDivision} />
    </div>
  )
}
