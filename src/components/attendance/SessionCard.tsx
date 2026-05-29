import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { SessionWithCount } from '@/lib/queries/attendance'

interface SessionCardProps {
  session: SessionWithCount
}

function formatSessionDate(sessionDate: string, dayLabel: string | null): string {
  // Derive day from date if day_label is not available
  let dayName: string
  if (dayLabel) {
    dayName = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)
  } else {
    // session_date is YYYY-MM-DD; add T12:00:00 to avoid timezone issues
    const date = new Date(sessionDate + 'T12:00:00')
    const weekday = date.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu...
    if (weekday === 2) dayName = 'Martes'
    else if (weekday === 4) dayName = 'Jueves'
    else {
      const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      dayName = names[weekday] ?? ''
    }
  }

  // Format date as DD/MM/YYYY
  const parts = sessionDate.split('-')
  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : sessionDate

  return `${dayName} ${formatted}`
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link href={`/lista/${session.id}`}>
      <Card className="cursor-pointer hover:bg-accent transition-colors min-h-[64px]">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-base font-semibold leading-tight">
              {formatSessionDate(session.session_date, null)}
            </span>
            <span className="text-sm text-muted-foreground">
              {session.present_count} presentes
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}
