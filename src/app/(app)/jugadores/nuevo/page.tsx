import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NuevoJugadorPage() {
  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-semibold mb-4">Agregar jugador</h1>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Próximamente: formulario de alta (Plan 04).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
