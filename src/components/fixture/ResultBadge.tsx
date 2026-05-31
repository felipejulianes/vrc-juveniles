import { Badge } from '@/components/ui/badge'
import type { MatchResult } from '@/lib/matches/utils'

type ResultBadgeProps = {
  result: MatchResult
  scoreHome: number | null
  scoreAway: number | null
}

export function ResultBadge({ result, scoreHome, scoreAway }: ResultBadgeProps) {
  const hasScore = scoreHome !== null && scoreAway !== null
  const scoreText = hasScore ? ` ${scoreHome}-${scoreAway}` : ''

  if (result === 'won') {
    return (
      <Badge
        className="bg-green-700 text-green-100 hover:bg-green-700"
        aria-label={`Resultado: Ganado${scoreText}`}
      >
        Ganado{scoreText}
      </Badge>
    )
  }
  if (result === 'lost') {
    return (
      <Badge
        className="bg-red-700 text-red-100 hover:bg-red-700"
        aria-label={`Resultado: Perdido${scoreText}`}
      >
        Perdido{scoreText}
      </Badge>
    )
  }
  if (result === 'draw') {
    return (
      <Badge variant="secondary" aria-label={`Resultado: Empate${scoreText}`}>
        Empate{scoreText}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" aria-label="Resultado: Pendiente">
      Pendiente
    </Badge>
  )
}
