'use client'

import { useState } from 'react'
import { useDivision, ALL_DIVISIONS_SENTINEL, ALL_DIVISIONS_ID, type Division } from '@/context/DivisionContext'
import { ChevronDown } from 'lucide-react'

// Dropdown propio (sin Radix Popover): el Popper de radix-ui quedaba sin
// posicionar (translate -200%) y congelaba el renderer al abrirse.
export function DivisionSelector() {
  const { activeDivision, setActiveDivision, divisions, userRole } = useDivision()
  const [open, setOpen] = useState(false)

  // Para admin mostramos siempre el selector (incluso con 1 división) por la opción "Todas".
  // Para no-admin: comportamiento original (ocultar si < 2 divisiones).
  if (userRole !== 'admin' && divisions.length < 2) return null

  const options = userRole === 'admin'
    ? [...divisions, ALL_DIVISIONS_SENTINEL]
    : divisions

  function select(d: Division) {
    setActiveDivision(d)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-9 inline-flex items-center gap-1 rounded-full px-3 text-sm font-medium bg-secondary text-secondary-foreground border border-border"
      >
        {activeDivision?.name ?? 'División'}
        <ChevronDown
          size={14}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>

      {open && (
        <>
          {/* Backdrop: cierra al tocar afuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="listbox"
            className="absolute right-0 top-full mt-1 z-50 w-48 p-1 rounded-lg border shadow-md"
            style={{
              backgroundColor: 'var(--popover)',
              borderColor: 'var(--border)',
            }}
          >
            {options.map((d) => {
              const isActive = activeDivision?.id === d.id
              const isAll = d.id === ALL_DIVISIONS_ID
              return (
                <button
                  key={d.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => select(d)}
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
          </div>
        </>
      )}
    </div>
  )
}
