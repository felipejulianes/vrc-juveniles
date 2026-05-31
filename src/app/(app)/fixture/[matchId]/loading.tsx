import { Skeleton } from '@/components/ui/skeleton'

export default function MatchDetailLoading() {
  return (
    <div className="px-4 pt-4 pb-24 space-y-6 max-w-2xl mx-auto">
      <Skeleton className="h-32 rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
    </div>
  )
}
