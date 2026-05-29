import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getById } from '@/lib/queries/players'
import { PlayerForm } from '@/components/players/PlayerForm'
import type { Database } from '@/lib/supabase/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type DivisionRow = Database['public']['Tables']['divisions']['Row']
type CoachDivisionRow = Database['public']['Tables']['coach_divisions']['Row']

interface Props {
  params: { id: string }
}

export default async function EditarJugadorPage({ params }: Props) {
  const player = await getById(params.id)
  if (!player) notFound()

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<ProfileRow, 'role'> | null
  let availableDivisions: { id: string; name: string }[] = []

  if (profile?.role === 'admin') {
    const { data: divData } = await sb
      .from('divisions')
      .select('id, name')
      .eq('is_juvenile', true)
      .order('name')
    availableDivisions = (divData as Pick<DivisionRow, 'id' | 'name'>[] | null) ?? []
  } else {
    const { data: cdData } = await sb
      .from('coach_divisions')
      .select('division_id, divisions!inner(id, name, is_juvenile)')
      .eq('coach_id', user.id)
      .eq('divisions.is_juvenile', true)

    type CdWithDiv = CoachDivisionRow & { divisions: Pick<DivisionRow, 'id' | 'name' | 'is_juvenile'> }
    availableDivisions = ((cdData as CdWithDiv[] | null) ?? []).map((r) => ({
      id: r.divisions.id,
      name: r.divisions.name,
    }))
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-[20px] font-semibold mb-4">Editar jugador</h1>
      <PlayerForm
        mode="edit"
        availableDivisions={availableDivisions}
        defaultDivisionId={player.division_id}
        initial={{
          id: player.id,
          first_name: player.first_name,
          last_name: player.last_name,
          dni: player.dni,
          birth_date: player.birth_date,
          parent_phone: player.parent_phone,
          parent_name: player.parent_name,
          division_id: player.division_id,
          photo_url: player.photo_url,
          position_primary: player.player_positions?.position_primary ?? null,
          position_alt1: player.player_positions?.position_alt1 ?? null,
          apto_medico: player.apto_medico ?? false,
        }}
      />
    </div>
  )
}
