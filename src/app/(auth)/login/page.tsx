import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

interface LoginPageProps {
  searchParams: { error?: string }
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
        <CardContent className="space-y-4">
          {searchParams.error === 'callback' && (
            <div className="rounded-md bg-destructive/15 p-3">
              <p className="text-sm text-destructive">
                Error de autenticación. Intentá de nuevo.
              </p>
            </div>
          )}
          <GoogleSignInButton />
        </CardContent>
      </Card>
    </div>
  )
}
