import { notFound } from 'next/navigation'
import { getSession, getRecordsForSession } from '@/lib/queries/attendance'
import { listByDivision } from '@/lib/queries/players'
import { AttendanceGrid } from '@/components/attendance/AttendanceGrid'

interface ActiveSessionPageProps {
  params: { sessionId: string }
}

export default async function ActiveSessionPage({ params }: ActiveSessionPageProps) {
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
    <AttendanceGrid
      sessionId={session.id}
      divisionId={session.division_id}
      sessionDate={session.session_date}
      initialPlayers={players}
      initialAttendance={initialAttendance}
    />
  )
}
