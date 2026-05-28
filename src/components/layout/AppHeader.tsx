import { DivisionSelector } from './DivisionSelector'
import { LogoutButton } from './LogoutButton'

export function AppHeader() {
  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      <span
        className="text-base font-semibold tracking-tight"
        style={{ color: 'var(--foreground)' }}
      >
        VRC Juveniles
      </span>
      <div className="flex items-center gap-2">
        <DivisionSelector />
        <LogoutButton />
      </div>
    </header>
  )
}
