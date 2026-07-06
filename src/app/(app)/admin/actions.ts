'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

const createCoachSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Ingresá un email válido.'),
  division_ids: z.array(z.string()).min(1, 'Seleccioná al menos una división.'),
})

export async function createCoach(formData: FormData) {
  await requireAdmin()

  const rawDivisionIds = formData.getAll('division_ids') as string[]

  const parsed = createCoachSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    division_ids: rawDivisionIds,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Datos inválidos.')
  }

  const { full_name, email, division_ids } = parsed.data

  const adminClient = createAdminClient()

  // Step 1: Invite the user via email
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: 'coach' },
    })

  if (inviteError) {
    throw new Error(`No se pudo invitar al usuario: ${inviteError.message}`)
  }

  const newUserId = inviteData.user?.id
  if (!newUserId) {
    throw new Error('No se pudo obtener el ID del usuario creado.')
  }

  // Step 2: Upsert profile — el trigger on_auth_user_created ya crea la fila,
  // acá solo pisamos el nombre con el que cargó el admin
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({ id: newUserId, full_name, role: 'coach' } as unknown as never, {
      onConflict: 'id',
    })

  if (profileError) {
    throw new Error(`No se pudo crear el perfil: ${profileError.message}`)
  }

  // Step 3: Insert coach_divisions rows
  const coachDivisionRows = division_ids.map((division_id) => ({
    coach_id: newUserId,
    division_id,
  }))

  const { error: cdError } = await adminClient
    .from('coach_divisions')
    .insert(coachDivisionRows as unknown as never)

  if (cdError) {
    throw new Error(`No se pudo asignar las divisiones: ${cdError.message}`)
  }

  revalidatePath('/admin')
}

/**
 * Reemplaza las divisiones JUVENILES asignadas a un coach existente.
 * No toca asignaciones a divisiones de infantiles (M6-M14).
 */
export async function setCoachDivisions(
  coachId: string,
  divisionIds: string[]
): Promise<void> {
  await requireAdmin()

  if (!coachId) throw new Error('Falta el coach.')

  const adminClient = createAdminClient()

  // Universo de divisiones juveniles — límite de lo que esta acción puede tocar
  const { data: juvData, error: juvError } = await adminClient
    .from('divisions')
    .select('id')
    .eq('is_juvenile', true)
  if (juvError) throw new Error('No se pudieron cargar las divisiones: ' + juvError.message)

  const juvenileIds = new Set(((juvData as { id: string }[] | null) ?? []).map((d) => d.id))
  const invalid = divisionIds.filter((id) => !juvenileIds.has(id))
  if (invalid.length > 0) throw new Error('División inválida.')

  const { error: delError } = await adminClient
    .from('coach_divisions')
    .delete()
    .eq('coach_id', coachId)
    .in('division_id', Array.from(juvenileIds))
  if (delError) throw new Error('No se pudo actualizar: ' + delError.message)

  if (divisionIds.length > 0) {
    const rows = divisionIds.map((division_id) => ({ coach_id: coachId, division_id }))
    const { error: insError } = await adminClient
      .from('coach_divisions')
      .insert(rows as unknown as never)
    if (insError) throw new Error('No se pudo asignar: ' + insError.message)
  }

  revalidatePath('/admin')
}

export async function removeCoachDivision(formData: FormData) {
  await requireAdmin()

  const coach_id = formData.get('coach_id') as string
  const division_id = formData.get('division_id') as string

  if (!coach_id || !division_id) {
    throw new Error('Datos insuficientes para eliminar la asignación.')
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('coach_divisions')
    .delete()
    .eq('coach_id', coach_id)
    .eq('division_id', division_id)

  if (error) {
    throw new Error(`No se pudo eliminar la asignación: ${error.message}`)
  }

  revalidatePath('/admin')
}
