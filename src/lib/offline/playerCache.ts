import { getDB } from './queue'
import type { PlayerWithPosition } from '@/lib/queries/players'

const STORE = 'players-cache'

export async function cachePlayersForDivision(
  divisionId: string,
  players: PlayerWithPosition[]
): Promise<void> {
  if (typeof window === 'undefined') return
  const db = await getDB()
  await db.put(STORE, { division_id: divisionId, players, cached_at: Date.now() })
}

export async function getCachedPlayers(
  divisionId: string
): Promise<PlayerWithPosition[]> {
  if (typeof window === 'undefined') return []
  const db = await getDB()
  const row = await db.get(STORE, divisionId)
  return row?.players ?? []
}
