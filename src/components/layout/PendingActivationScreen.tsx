import { Hourglass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function signOutAction() {
  'use server'
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

interface PendingActivationScreenProps {
  userName?: string | null
}

export function PendingActivationScreen({
  userName,
}: PendingActivationScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          <Hourglass
            size={48}
            className="text-muted-foreground"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              Cuenta pendiente de activación
            </h2>
            {userName && (
              <p className="text-sm text-muted-foreground">Hola, {userName}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Tu cuenta fue creada pero no tiene divisiones asignadas. Pedile al
              administrador del club que te asigne una división.
            </p>
          </div>
          <form action={signOutAction} className="w-full">
            <Button variant="outline" type="submit" className="w-full">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
