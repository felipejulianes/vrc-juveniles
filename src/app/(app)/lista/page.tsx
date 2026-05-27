import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ListaPage() {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Próximamente: historial de entrenamientos (Plan 05).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
