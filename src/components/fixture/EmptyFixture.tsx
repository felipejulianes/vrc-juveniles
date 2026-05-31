import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

export function EmptyFixture({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" aria-hidden />
      <h2 className="text-xl font-semibold mb-2">
        {isAdmin ? 'Sin partidos cargados' : 'Sin partidos programados'}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {isAdmin
          ? 'Importá el fixture URBA o agregá un partido manualmente.'
          : 'El fixture de esta división aún no fue cargado.'}
      </p>
      {isAdmin && (
        <Link
          href="/admin/fixture-import"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Importar fixture
        </Link>
      )}
    </div>
  )
}
