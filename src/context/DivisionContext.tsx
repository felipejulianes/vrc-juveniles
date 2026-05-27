'use client'

import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'vrc_active_division'

type Division = { id: string; name: string }

type DivisionContextType = {
  activeDivision: Division | null
  setActiveDivision: (d: Division) => void
  divisions: Division[]
}

const DivisionContext = createContext<DivisionContextType | null>(null)

export function DivisionProvider({
  children,
  initialDivisions,
}: {
  children: React.ReactNode
  initialDivisions: Division[]
}) {
  const [activeDivision, setActiveDivisionState] = useState<Division | null>(
    () => {
      if (typeof window === 'undefined') return initialDivisions[0] ?? null
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Division
          const valid = initialDivisions.find((d) => d.id === parsed.id)
          return valid ?? initialDivisions[0] ?? null
        } catch {
          return initialDivisions[0] ?? null
        }
      }
      return initialDivisions[0] ?? null
    }
  )

  function setActiveDivision(d: Division) {
    setActiveDivisionState(d)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
  }

  return (
    <DivisionContext.Provider
      value={{ activeDivision, setActiveDivision, divisions: initialDivisions }}
    >
      {children}
    </DivisionContext.Provider>
  )
}

export function useDivision(): DivisionContextType {
  const ctx = useContext(DivisionContext)
  if (!ctx) throw new Error('useDivision must be used within DivisionProvider')
  return ctx
}
