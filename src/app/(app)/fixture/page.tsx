import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listAllJuvenile } from '@/lib/queries/matches'
import { FixtureListShell } from '@/components/fixture/FixtureListShell'

export default async function FixturePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  const role = (profileData?.role ?? 'coach') as 'admin' | 'coach' | 'tutora'

  // Always fetch all juvenile matches server-side; RLS restricts to coach's divisions automatically.
  // Client filters by activeDivision for UX (no re-fetch on division switch).
  const matches = await listAllJuvenile()

  const items = matches.map((m) => ({
    id: m.id,
    division_id: m.division_id,
    division_name: m.divisions?.name ?? '',
    match_date: m.match_date,
    rival: m.rival,
    home_away: m.home_away as 'local' | 'visitante',
    match_time: m.match_time,
    fecha_nro: m.fecha_nro,
    subequipo: m.subequipo,
    score_home: m.score_home,
    score_away: m.score_away,
  }))

  return <FixtureListShell allMatches={items} isAdmin={role === 'admin'} />
}
