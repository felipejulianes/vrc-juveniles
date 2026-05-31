export type MatchResult = 'won' | 'lost' | 'draw' | 'pending'

export function getMatchResult(
  scoreHome: number | null,
  scoreAway: number | null,
  _matchDate: string
): MatchResult {
  if (scoreHome === null || scoreAway === null) return 'pending'
  if (scoreHome > scoreAway) return 'won'
  if (scoreHome < scoreAway) return 'lost'
  return 'draw'
}

export function formatMatchDate(isoDate: string): string {
  // 'YYYY-MM-DD' -> 'Sáb 11/04' (es-AR)
  // Normalize date separators: some ICU builds use '-' instead of '/'
  const date = new Date(isoDate + 'T12:00:00')
  const formatted = date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  // Replace '-' separators between digits with '/' to ensure consistent output
  return formatted.replace(/(\d{2})-(\d{2})/g, '$1/$2')
}
