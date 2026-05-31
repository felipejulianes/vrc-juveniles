'use client'

import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'vrc_active_division'

export const ALL_DIVISIONS_ID = '__all__'

export type Division = { id: string; name: string }

export const ALL_DIVISIONS_SENTINEL: Division = {
  id: ALL_DIVISIONS_ID,
  name: 'Todas las divisiones',
}

export function isAllDivisions(d: Division | null): boolean {
  return d?.id === ALL_DIVISIONS_ID
}

export type UserRole = 'admin' | 'coach' | 'tutora'

type DivisionContextType = {
  activeDivision: Division | null
  setActiveDivision: (d: Division) => void
  divisions: Division[]
  userRole: UserRole
}

const DivisionContext = createContext<DivisionContextType | null>(null)

export function DivisionProvider({
  children,
  initialDivisions,
  userRole,
}: {
  children: React.ReactNode
  initialDivisions: Division[]
  userRole: UserRole
}) {
  const [activeDivision, setActiveDivisionState] = useState<Division | null>(
    () => {
      if (typeof window === 'undefined') return initialDivisions[0] ?? null
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Division
          // Allow restoring the ALL_DIVISIONS sentinel only for admin
          if (parsed.id === ALL_DIVISIONS_ID) {
            return userRole === 'admin' ? ALL_DIVISIONS_SENTINEL : (initialDivisions[0] ?? null)
          }
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
      value={{ activeDivision, setActiveDivision, divisions: initialDivisions, userRole }}
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
