import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FixtureImportClient } from './FixtureImportClient'

export default async function FixtureImportPage() {
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

  const profile = profileData as { role: 'admin' | 'coach' | 'tutora' } | null
  if (profile?.role !== 'admin') {
    redirect('/jugadores')
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Importar fixture URBA</h1>
      <FixtureImportClient />
    </div>
  )
}
