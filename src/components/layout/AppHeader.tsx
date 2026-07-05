import Link from 'next/link'
import { Shield } from 'lucide-react'
import { DivisionSelector } from './DivisionSelector'
import { LogoutButton } from './LogoutButton'

export function AppHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <header
      className="h-14 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      <Link
        href="/"
        className="text-base font-semibold tracking-tight"
        style={{ color: 'var(--foreground)' }}
      >
        VRC Juveniles
      </Link>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Administración"
            className="p-2 rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          >
            <Shield size={18} />
          </Link>
        )}
        <DivisionSelector />
        <LogoutButton />
      </div>
    </header>
  )
}
