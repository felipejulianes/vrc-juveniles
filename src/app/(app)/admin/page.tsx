import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createCoach } from './actions'
import { CoachDivisionsEditor } from '@/components/admin/CoachDivisionsEditor'
import { PageHeader } from '@/components/layout/PageHeader'

type DivisionRow = { id: string; name: string; is_juvenile?: boolean }
type ProfileRow = { id: string; full_name: string | null; role: 'admin' | 'coach' | 'tutora' }
type CoachDivisionRow = { coach_id: string; division_id: string; division_name?: string }

export default async function AdminPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<ProfileRow, 'role'> | null
  if (profile?.role !== 'admin') {
    redirect('/jugadores')
  }

  // Load all juvenile divisions
  const { data: juvenileDivisionsData } = await supabase
    .from('divisions')
    .select('id, name')
    .eq('is_juvenile', true)
    .order('name')

  const juvenileDivisions = (juvenileDivisionsData as DivisionRow[] | null) ?? []

  // Load all coaches
  const { data: coachesData } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'coach')
    .order('full_name')

  const coaches = (coachesData as ProfileRow[] | null) ?? []

  // Load all coach_divisions and join with juvenile divisions manually
  const { data: allCoachDivisionsData } = await supabase
    .from('coach_divisions')
    .select('coach_id, division_id')

  const allCoachDivisions = (allCoachDivisionsData as CoachDivisionRow[] | null) ?? []

  // Build a lookup map: division_id -> name (from juvenile list)
  const divisionNameById = Object.fromEntries(
    juvenileDivisions.map((d) => [d.id, d.name])
  )

  // Filter coach_divisions to only juvenile ones
  const juvenileCoachDivisions = allCoachDivisions
    .filter((cd) => divisionNameById[cd.division_id] !== undefined)
    .map((cd) => ({
      ...cd,
      division_name: divisionNameById[cd.division_id],
    }))

  return (
    <div className="pb-6">
      <PageHeader title="Administración" subtitle="Fixture, coaches y divisiones" />
      <div className="px-4 space-y-6 max-w-2xl mx-auto">

      {/* Import de fixture URBA */}
      <Card>
        <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Fixture URBA</p>
            <p className="text-xs text-muted-foreground">
              Importar el calendario de partidos desde CSV
            </p>
          </div>
          <a
            href="/admin/fixture-import"
            className="shrink-0 px-3 py-2 rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-semibold"
          >
            Importar
          </a>
        </CardContent>
      </Card>

      {/* Create Coach Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear nuevo coach</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCoach} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Juan Pérez"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="coach@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Divisiones juveniles</Label>
              <div className="grid grid-cols-2 gap-2">
                {juvenileDivisions.map((div) => (
                  <label
                    key={div.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="division_ids"
                      value={div.id}
                      className="accent-primary"
                    />
                    {div.name}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Crear coach
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Coaches list */}
      <div>
        <h2 className="text-base font-semibold mb-1">Coaches registrados</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Tocá las divisiones para asignar o quitar. Incluye a cualquiera que
          haya entrado con Google y esté pendiente de activación.
        </p>
        {coaches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay coaches registrados.
          </p>
        ) : (
          <div className="space-y-2">
            {coaches.map((coach) => {
              const assignedIds = juvenileCoachDivisions
                .filter((cd) => cd.coach_id === coach.id)
                .map((cd) => cd.division_id)

              return (
                <CoachDivisionsEditor
                  key={coach.id}
                  coachId={coach.id}
                  coachName={coach.full_name ?? 'Sin nombre'}
                  divisions={juvenileDivisions}
                  assignedIds={assignedIds}
                />
              )
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
