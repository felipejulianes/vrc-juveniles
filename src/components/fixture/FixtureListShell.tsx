'use client'

import { useMemo, useState } from 'react'
import { useDivision, isAllDivisions } from '@/context/DivisionContext'
import { FixtureList } from './FixtureList'
import { MatchFab } from './MatchFab'
import { MatchFormDialog } from './MatchFormDialog'

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

export function FixtureListShell({
  allMatches,
  isAdmin,
}: {
  allMatches: MatchItem[]
  isAdmin: boolean
}) {
  const { activeDivision } = useDivision()
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    if (!activeDivision || isAllDivisions(activeDivision)) {
      return isAdmin ? allMatches : []
    }
    return allMatches.filter((m) => m.division_id === activeDivision.id)
  }, [activeDivision, allMatches, isAdmin])

  // FAB only shown when a specific division is selected (cannot create without picking division
  // unless admin who can choose in the form). For admin in "Todas las divisiones", still show FAB
  // because the form has a division select.
  const showFab = !!activeDivision

  return (
    <>
      <FixtureList matches={filtered} />
      {showFab && <MatchFab onClick={() => setCreating(true)} />}
      <MatchFormDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
