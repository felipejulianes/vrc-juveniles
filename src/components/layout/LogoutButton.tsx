'use client'

import { signOut } from '@/app/(app)/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
        <LogOut size={16} />
      </Button>
    </form>
  )
}
