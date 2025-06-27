import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full mr-2" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>

          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-20 w-full mb-4" />

          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="mb-6">
              <CardHeader>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
