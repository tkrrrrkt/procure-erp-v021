import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">仕入先別単価マスタ</h1>

      {/* 仕入先選択カードのスケルトン */}
      <Card>
        <CardHeader>
          <CardTitle>仕入先選択</CardTitle>
          <Skeleton className="h-4 w-[250px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* 履歴セット一覧カードのスケルトン */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>単価履歴一覧</CardTitle>
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[150px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 単価データ詳細カードのスケルトン */}
      <Card>
        <CardHeader>
          <CardTitle>単価詳細</CardTitle>
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[100px]" />
                <Skeleton className="h-10 w-[120px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
