import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <Skeleton className="h-10 w-[300px] mb-2" />
        <Skeleton className="h-4 w-[450px]" />
      </div>

      <Skeleton className="h-10 w-[300px] mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-5 w-[60px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>

            <Skeleton className="h-[300px] w-full mb-6" />

            <div className="flex justify-end">
              <Skeleton className="h-10 w-[150px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
