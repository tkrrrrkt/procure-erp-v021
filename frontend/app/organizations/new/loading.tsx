import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function OrganizationNewLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex items-center space-x-2 pt-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-12" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
