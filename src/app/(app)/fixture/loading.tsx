import { Skeleton } from '@/components/ui/skeleton'

export default function FixtureLoading() {
  return (
    <div className="px-4 pt-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[72px] rounded-lg" />
      ))}
    </div>
  )
}
