import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Partido no encontrado</h2>
      <p className="text-sm text-muted-foreground mb-6">
        El partido no existe o no tenes permiso para verlo.
      </p>
      <Link href="/fixture" className="text-sm text-primary underline-offset-4 hover:underline">
        Volver al fixture
      </Link>
    </div>
  )
}
