'use client'

import { MatchCard } from './MatchCard'
import { EmptyFixture } from './EmptyFixture'
import { useDivision, isAllDivisions } from '@/context/DivisionContext'

type MatchItem = {
  id: string
  division_id: string
  division_name?: string
  match_date: string
  rival: string
  home_away: 'local' | 'visitante'
  match_time: string | null
  fecha_nro: number | null
  subequipo: string | null
  score_home: number | null
  score_away: number | null
}

type FixtureListProps = {
  matches: MatchItem[]
}

export function FixtureList({ matches }: FixtureListProps) {
  const { activeDivision, userRole } = useDivision()
  const showGrouped = isAllDivisions(activeDivision)

  if (matches.length === 0) {
    return <EmptyFixture isAdmin={userRole === 'admin'} />
  }

  if (!showGrouped) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-3">
        {matches.map((m) => (
          <MatchCard key={m.id} {...m} />
        ))}
      </div>
    )
  }

  // Grouped by division for admin "Todas las divisiones"
  const groups = new Map<string, MatchItem[]>()
  for (const m of matches) {
    const key = m.division_name ?? m.division_id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }
  const sortedKeys = Array.from(groups.keys()).sort()

  return (
    <div className="pt-2 pb-24">
      {sortedKeys.map((divName) => (
        <section key={divName}>
          <h2 className="text-xl font-semibold px-4 pt-6 pb-2">{divName}</h2>
          <div className="px-4 space-y-3">
            {groups.get(divName)!.map((m) => (
              <MatchCard key={m.id} {...m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
