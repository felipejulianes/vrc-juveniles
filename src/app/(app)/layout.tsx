import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DivisionProvider } from '@/context/DivisionContext'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { PendingActivationScreen } from '@/components/layout/PendingActivationScreen'
import { Toaster } from '@/components/ui/sonner'
import { SyncProvider } from '@/components/attendance/SyncProvider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile with explicit type assertion to avoid generic inference issues
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    id: string
    full_name: string | null
    role: 'admin' | 'coach' | 'tutora'
  } | null

  let juvenileDivisions: { id: string; name: string }[] = []

  if (profile?.role === 'admin') {
    // Admin sees all juvenile divisions
    const { data: allJuvData } = await supabase
      .from('divisions')
      .select('id, name')
      .eq('is_juvenile', true)
      .order('name')

    juvenileDivisions = (allJuvData as { id: string; name: string }[] | null) ?? []
  } else {
    // Coach: get their coach_divisions, then fetch only juvenile divisions
    const { data: cdData } = await supabase
      .from('coach_divisions')
      .select('division_id')
      .eq('coach_id', user.id)

    const coachDivisionIds = (cdData as { division_id: string }[] | null)
      ?.map((r) => r.division_id) ?? []

    if (coachDivisionIds.length > 0) {
      const { data: divsData } = await supabase
        .from('divisions')
        .select('id, name')
        .eq('is_juvenile', true)
        .in('id', coachDivisionIds)
        .order('name')

      juvenileDivisions = (divsData as { id: string; name: string }[] | null) ?? []
    }
  }

  if (juvenileDivisions.length === 0 && profile?.role !== 'admin') {
    return <PendingActivationScreen userName={profile?.full_name} />
  }

  const userRole = profile?.role ?? 'coach'

  return (
    <DivisionProvider initialDivisions={juvenileDivisions} userRole={userRole as 'admin' | 'coach' | 'tutora'}>
      <SyncProvider>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <OfflineBanner />
          <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <BottomNav userRole={userRole as 'admin' | 'coach' | 'tutora'} />
          <Toaster />
        </div>
      </SyncProvider>
    </DivisionProvider>
  )
}
