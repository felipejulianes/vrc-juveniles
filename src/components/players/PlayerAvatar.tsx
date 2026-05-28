'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  src: string | null
  firstName: string
  lastName: string
  size?: 'sm' | 'lg'
}

export function PlayerAvatar({ src, firstName, lastName, size = 'sm' }: PlayerAvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  return (
    <Avatar
      className={cn(
        'shrink-0',
        size === 'sm' ? 'h-10 w-10' : 'h-24 w-24'
      )}
    >
      {src && <AvatarImage src={src} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback
        className="bg-muted text-muted-foreground font-semibold"
        style={{ fontSize: size === 'sm' ? '0.875rem' : '1.5rem' }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
