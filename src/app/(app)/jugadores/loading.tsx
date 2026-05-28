import { Skeleton } from '@/components/ui/skeleton'

export default function JugadoresLoading() {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}
