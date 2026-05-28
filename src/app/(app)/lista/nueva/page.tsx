import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionForm } from '@/components/attendance/SessionForm'

interface NuevaSessionPageProps {
  searchParams: { division?: string }
}

export default async function NuevaSessionPage({ searchParams }: NuevaSessionPageProps) {
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

  let availableDivisions: { id: string; name: string }[] = []

  if (profile?.role === 'admin') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allDivs } = await (supabase as any)
      .from('divisions')
      .select('id, name')
      .eq('is_juvenile', true)
      .order('name')
    availableDivisions = (allDivs as { id: string; name: string }[] | null) ?? []
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
      availableDivisions = (divsData as { id: string; name: string }[] | null) ?? []
    }
  }

  if (availableDivisions.length === 0) redirect('/lista')

  // Pick defaultDivisionId from searchParams if valid, else first available
  const requestedDivisionId = searchParams.division
  const defaultDivision =
    availableDivisions.find((d) => d.id === requestedDivisionId) ??
    availableDivisions[0]

  if (!defaultDivision) redirect('/lista')

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Iniciar entrenamiento */}
      <SessionForm
        availableDivisions={availableDivisions}
        defaultDivisionId={defaultDivision.id}
      />
    </div>
  )
}
