'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  ListChecks,
  CalendarDays,
  Shield,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'

interface BottomNavProps {
  userRole: 'admin' | 'coach' | 'tutora'
}

type Tab = {
  label: string
  href: string
  icon: React.ElementType
  alwaysDisabled?: boolean
  adminOnly?: boolean
}

const TABS: Tab[] = [
  { label: 'Jugadores', href: '/jugadores', icon: Users },
  { label: 'Lista', href: '/lista', icon: ListChecks },
  { label: 'Fixture', href: '/fixture', icon: CalendarDays, alwaysDisabled: true },
  { label: 'Admin', href: '/admin', icon: Shield, adminOnly: true },
  {
    label: 'Estadística',
    href: '/estadistica',
    icon: BarChart3,
    alwaysDisabled: true,
  },
]

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname()

  function handleDisabledTap() {
    toast('Disponible próximamente')
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center border-t"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {TABS.map((tab) => {
        // Admin tab: show always, but disabled if non-admin
        const isAdminTab = tab.adminOnly === true
        const isDisabledForRole = isAdminTab && userRole !== 'admin'
        const isDisabled = tab.alwaysDisabled === true || isDisabledForRole

        const isActive =
          !isDisabled &&
          (pathname === tab.href || pathname.startsWith(tab.href + '/'))

        const Icon = tab.icon

        if (isDisabled) {
          return (
            <button
              key={tab.href}
              onClick={handleDisabledTap}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs"
              style={{
                opacity: 0.4,
                color: 'var(--muted-foreground)',
              }}
              aria-label={`${tab.label} — no disponible`}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          )
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors"
            style={{
              color: isActive
                ? 'var(--sidebar-primary)'
                : 'var(--muted-foreground)',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
