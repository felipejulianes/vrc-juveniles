'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  ListChecks,
  CalendarDays,
  BarChart3,
} from 'lucide-react'

type Tab = {
  label: string
  href: string
  icon: React.ElementType
}

const TABS: Tab[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Lista', href: '/lista', icon: ListChecks },
  { label: 'Fixture', href: '/fixture', icon: CalendarDays },
  { label: 'Jugadores', href: '/jugadores', icon: Users },
  { label: 'Estadística', href: '/estadistica', icon: BarChart3 },
]

export function BottomNav() {
  const pathname = usePathname()

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
        const isActive =
          tab.href === '/'
            ? pathname === '/'
            : pathname === tab.href || pathname.startsWith(tab.href + '/')

        const Icon = tab.icon

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
