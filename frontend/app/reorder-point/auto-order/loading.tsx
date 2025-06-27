import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-medium">発注点発注データを読み込んでいます...</h2>
      <p className="text-muted-foreground mt-2">しばらくお待ちください</p>
    </div>
  )
}
