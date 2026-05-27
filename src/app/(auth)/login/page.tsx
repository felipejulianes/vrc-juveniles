import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signInWithMagicLink } from './actions'

interface LoginPageProps {
  searchParams: { sent?: string; error?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            VRC Juveniles
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Virreyes Rugby Club
          </p>
        </CardHeader>
        <CardContent>
          {searchParams.sent === '1' ? (
            <div className="rounded-md bg-secondary p-4 text-center">
              <p className="text-sm text-foreground">
                Revisá tu email para el enlace de acceso.
              </p>
            </div>
          ) : (
            <form action={signInWithMagicLink} className="space-y-4">
              {searchParams.error === 'callback' && (
                <div className="rounded-md bg-destructive/15 p-3">
                  <p className="text-sm text-destructive">
                    El enlace no es válido o ya expiró. Pedí uno nuevo.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar enlace de acceso
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
