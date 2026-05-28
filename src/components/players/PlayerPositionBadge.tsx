import { RUGBY_POSITIONS } from '@/lib/positions/constants'

interface PlayerPositionBadgeProps {
  positionNumber: number | null
}

export function PlayerPositionBadge({ positionNumber }: PlayerPositionBadgeProps) {
  if (positionNumber === null) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const position = RUGBY_POSITIONS.find((p) => p.number === positionNumber)
  const ariaLabel = position
    ? `Puesto ${positionNumber} - ${position.name}`
    : `Puesto ${positionNumber}`

  return (
    <span
      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs font-semibold shrink-0"
      aria-label={ariaLabel}
    >
      {positionNumber}
    </span>
  )
}
