import { notFound } from 'next/navigation'
import { getSession, getRecordsForSession } from '@/lib/queries/attendance'
import { listByDivision } from '@/lib/queries/players'
import { AttendanceGrid } from '@/components/attendance/AttendanceGrid'

interface EditSessionPageProps {
  params: { sessionId: string }
}

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const session = await getSession(params.sessionId)
  if (!session) notFound()

  const [players, records] = await Promise.all([
    listByDivision(session.division_id),
    getRecordsForSession(params.sessionId),
  ])

  const initialAttendance: Record<string, boolean> = {}
  for (const r of records) {
    initialAttendance[r.player_id] = r.present
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <AttendanceGrid
        sessionId={session.id}
        divisionId={session.division_id}
        initialPlayers={players}
        initialAttendance={initialAttendance}
      />
    </div>
  )
}
