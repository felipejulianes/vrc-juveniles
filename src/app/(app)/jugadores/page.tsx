import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function JugadoresPage() {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Jugadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Próximamente: lista de jugadores (Plan 03).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
