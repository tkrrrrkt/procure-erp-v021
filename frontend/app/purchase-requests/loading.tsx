import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}
