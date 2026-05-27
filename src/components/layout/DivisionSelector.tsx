'use client'

import { useDivision } from '@/hooks/useDivision'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

export function DivisionSelector() {
  const { activeDivision, setActiveDivision, divisions } = useDivision()

  if (divisions.length < 2) return null

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
      <PopoverContent align="end" className="w-40 p-1">
        {divisions.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDivision(d)}
            className={[
              'w-full text-left px-3 py-2 rounded text-sm transition-colors',
              activeDivision?.id === d.id
                ? 'bg-primary/20 text-primary font-semibold border border-[color:var(--primary)]'
                : 'hover:bg-secondary text-foreground',
            ].join(' ')}
          >
            {d.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
