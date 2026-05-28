import { Users } from 'lucide-react'

export function EmptyPlayerList() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        No hay jugadores en esta división
      </h3>
      <p className="text-base font-normal text-muted-foreground">
        Agregá el primer jugador con el botón de abajo.
      </p>
    </div>
  )
}
