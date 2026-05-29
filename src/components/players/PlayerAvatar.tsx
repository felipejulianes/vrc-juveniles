'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  src: string | null
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
}

export function PlayerAvatar({ src, firstName, lastName, size = 'sm' }: PlayerAvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  const sizeClass = size === 'sm' ? 'h-10 w-10' : size === 'md' ? 'h-14 w-14' : 'h-24 w-24'
  const fontSize = size === 'sm' ? '0.875rem' : size === 'md' ? '1.125rem' : '1.5rem'

  return (
    <Avatar className={cn('shrink-0', sizeClass)}>
      {src && <AvatarImage src={src} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback
        className="bg-muted text-muted-foreground font-semibold"
        style={{ fontSize }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
