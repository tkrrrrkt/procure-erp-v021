import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="flex justify-between mt-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="space-y-4">
              <div className="h-10 bg-gradient-to-r from-teal-50 to-emerald-100 rounded-md" />
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  )
}
