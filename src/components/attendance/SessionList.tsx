'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDivision } from '@/context/DivisionContext'
import { SessionCard } from '@/components/attendance/SessionCard'
import { EmptySessionList } from '@/components/attendance/EmptySessionList'
import type { SessionWithCount } from '@/lib/queries/attendance'

interface SessionListProps {
  sessionsByDivision: Record<string, SessionWithCount[]>
}

export function SessionList({ sessionsByDivision }: SessionListProps) {
  const { activeDivision } = useDivision()

  const sessions = activeDivision ? (sessionsByDivision[activeDivision.id] ?? []) : []

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <Button asChild variant="default" className="w-full mb-4 h-12 text-base">
        <Link
          href={
            activeDivision
              ? `/lista/nueva?division=${activeDivision.id}`
              : '/lista/nueva'
          }
        >
          Tomar lista
        </Link>
      </Button>

      {sessions.length === 0 ? (
        <EmptySessionList />
      ) : (
        sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))
      )}
    </div>
  )
}
