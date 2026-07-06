import type { ReactNode } from 'react'

/**
 * Encabezado de página unificado: título grande + subtítulo opcional + acción.
 * Toda pantalla principal arranca con esto para que la app se sienta consistente.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3 max-w-2xl mx-auto w-full">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  )
}
