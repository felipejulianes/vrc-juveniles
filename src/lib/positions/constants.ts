// 10 roles sin distinción izquierda/derecha (la distinción por lado sí existe
// en el equipo vía slots 1-15 del Team Builder).
export const RUGBY_POSITIONS = [
  { number: 1,  abbr: 'PIL', name: 'Pilar',         covers: [1, 3],   group: 'Forwards' },
  { number: 2,  abbr: 'HOO', name: 'Hooker',        covers: [2],      group: 'Forwards' },
  { number: 4,  abbr: '2L',  name: '2da línea',     covers: [4, 5],   group: 'Forwards' },
  { number: 6,  abbr: 'ALA', name: 'Ala',           covers: [6, 7],   group: 'Forwards' },
  { number: 8,  abbr: '8VO', name: 'Octavo',        covers: [8],      group: 'Forwards' },
  { number: 9,  abbr: 'MS',  name: 'Medio scrum',   covers: [9],      group: 'Backs' },
  { number: 10, abbr: 'APT', name: 'Apertura',      covers: [10],     group: 'Backs' },
  { number: 12, abbr: 'CEN', name: 'Centro',        covers: [12, 13], group: 'Backs' },
  { number: 11, abbr: 'WIN', name: 'Wing',          covers: [11, 14], group: 'Backs' },
  { number: 15, abbr: 'FB',  name: 'Fullback',      covers: [15],     group: 'Backs' },
] as const

export type PositionNumber = typeof RUGBY_POSITIONS[number]['number']
export type PositionGroup = 'Forwards' | 'Backs'

export function getPositionByNumber(n: number | null) {
  if (n === null) return null
  return RUGBY_POSITIONS.find((p) => (p.covers as readonly number[]).includes(n)) ?? null
}
