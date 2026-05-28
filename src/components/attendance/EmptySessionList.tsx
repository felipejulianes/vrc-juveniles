import { ListChecks } from 'lucide-react'

export function EmptySessionList() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <ListChecks className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Sin entrenamientos registrados</h2>
      <p className="text-base text-muted-foreground">
        Iniciá el primer entrenamiento para comenzar el historial.
      </p>
    </div>
  )
}
