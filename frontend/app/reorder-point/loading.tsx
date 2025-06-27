import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-10 w-64" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="p-4">
              <div className="flex items-center space-x-4 py-4">
                <Skeleton className="h-6 w-full" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
