'use client'

import { useMemo } from 'react'
import { useDivision, isAllDivisions } from '@/context/DivisionContext'
import { FixtureList } from './FixtureList'

type MatchItem = Parameters<typeof FixtureList>[0]['matches'][number]

export function FixtureListShell({ allMatches, isAdmin }: { allMatches: MatchItem[]; isAdmin: boolean }) {
  const { activeDivision } = useDivision()
  const filtered = useMemo(() => {
    if (!activeDivision || isAllDivisions(activeDivision)) {
      return isAdmin ? allMatches : []
    }
    return allMatches.filter((m) => m.division_id === activeDivision.id)
  }, [activeDivision, allMatches, isAdmin])

  return <FixtureList matches={filtered} />
}
