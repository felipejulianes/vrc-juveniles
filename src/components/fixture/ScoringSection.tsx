'use client'

// Placeholder — full implementation in Task 3.

type EventType = 'try' | 'conversion' | 'penalty' | 'drop' | 'yellow_card' | 'red_card'

type Event = {
  id: string
  team: 'home' | 'away'
  event_type: EventType
  player_id: string | null
  rival_scorer: string | null
}

type Player = { id: string; label: string }

type Props = {
  matchId: string
  rivalName: string
  players: Player[]
  events: Event[]
}

export function ScoringSection(_props: Props) {
  return null
}
