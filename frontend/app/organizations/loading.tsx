import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function OrganizationsLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <Skeleton className="h-10 w-full md:w-1/4" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <div className="flex items-center py-4 border-b">
                <Skeleton className="h-5 w-1/5 mr-4" />
                <Skeleton className="h-5 w-1/5 mr-4" />
                <Skeleton className="h-5 w-1/5 mr-4" />
                <Skeleton className="h-5 w-1/5 mr-4" />
                <Skeleton className="h-5 w-1/5" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center py-4 border-b">
                  <Skeleton className="h-5 w-1/5 mr-4" />
                  <Skeleton className="h-5 w-1/5 mr-4" />
                  <Skeleton className="h-5 w-1/5 mr-4" />
                  <Skeleton className="h-5 w-1/5 mr-4" />
                  <Skeleton className="h-5 w-1/5" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
