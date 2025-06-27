import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-10 w-[250px]" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  )
}
