export const RUGBY_POSITIONS = [
  { number: 1,  name: 'Pilar izquierdo',    group: 'Forwards' },
  { number: 2,  name: 'Hooker',             group: 'Forwards' },
  { number: 3,  name: 'Pilar derecho',      group: 'Forwards' },
  { number: 4,  name: 'Segundo línea',      group: 'Forwards' },
  { number: 5,  name: 'Segundo línea',      group: 'Forwards' },
  { number: 6,  name: 'Ala ciego',          group: 'Forwards' },
  { number: 7,  name: 'Ala abierto',        group: 'Forwards' },
  { number: 8,  name: 'Octavo',             group: 'Forwards' },
  { number: 9,  name: 'Medio scrum',        group: 'Backs' },
  { number: 10, name: 'Apertura',           group: 'Backs' },
  { number: 11, name: 'Ala izquierdo',      group: 'Backs' },
  { number: 12, name: 'Centro interno',     group: 'Backs' },
  { number: 13, name: 'Centro externo',     group: 'Backs' },
  { number: 14, name: 'Ala derecho',        group: 'Backs' },
  { number: 15, name: 'Fullback',           group: 'Backs' },
] as const

export type PositionNumber = typeof RUGBY_POSITIONS[number]['number']
export type PositionGroup = 'Forwards' | 'Backs'
