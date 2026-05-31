'use client'

import { useDivision, ALL_DIVISIONS_SENTINEL, ALL_DIVISIONS_ID } from '@/context/DivisionContext'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

export function DivisionSelector() {
  const { activeDivision, setActiveDivision, divisions, userRole } = useDivision()

  // For admin we always show the selector (incluso con 1 división) because they may want "Todas".
  // For non-admin: original behavior (hide if < 2 divisions).
  if (userRole !== 'admin' && divisions.length < 2) return null

  const options = userRole === 'admin'
    ? [...divisions, ALL_DIVISIONS_SENTINEL]
    : divisions

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 rounded-full px-3 gap-1 text-sm font-medium border border-[color:var(--primary)]"
        >
          {activeDivision?.name ?? 'División'}
          <ChevronDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {options.map((d) => {
          const isActive = activeDivision?.id === d.id
          const isAll = d.id === ALL_DIVISIONS_ID
          return (
            <button
              key={d.id}
              onClick={() => setActiveDivision(d)}
              className={[
                'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                isActive
                  ? 'bg-primary/20 text-primary font-semibold border border-[color:var(--primary)]'
                  : 'hover:bg-secondary text-foreground',
                isAll && !isActive ? 'border-t border-border mt-1 pt-2' : '',
              ].join(' ')}
            >
              {d.name}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
