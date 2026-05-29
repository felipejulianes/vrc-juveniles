import { getPositionByNumber } from '@/lib/positions/constants'

interface PlayerPositionBadgeProps {
  positionNumber: number | null
}

export function PlayerPositionBadge({ positionNumber }: PlayerPositionBadgeProps) {
  const position = getPositionByNumber(positionNumber)

  if (!position) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  return (
    <span
      className="inline-flex items-center justify-center h-7 min-w-[1.75rem] px-1.5 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs font-semibold shrink-0"
      aria-label={position.name}
    >
      {position.abbr}
    </span>
  )
}
