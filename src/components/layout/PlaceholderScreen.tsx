import { Construction } from 'lucide-react'

interface PlaceholderScreenProps {
  title: string
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      <Construction
        size={48}
        className="text-muted-foreground"
        aria-hidden="true"
      />
      <p
        className="text-base text-muted-foreground text-center"
        style={{ fontWeight: 400 }}
      >
        {title} — Esta sección estará disponible próximamente.
      </p>
    </div>
  )
}
