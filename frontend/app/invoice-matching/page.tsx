"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { AlertCircle, ArrowLeft, Check, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// 発注データの型定義
interface PurchaseOrderItem {
  id: number
  itemCode: string
  itemName: string
  quantity: number
  unitPrice: number
  amount: number
  warehouseCode: string
  warehouseName: string
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  orderDate: Date
  vendorId: string
  vendorName: string
  orderType: string
  orderTypeLabel: string
  deliveryDate: Date
  departmentId: string
  departmentName: string
  personInChargeId: string
  personInChargeName: string
  status: string
  totalAmount: number
  items: PurchaseOrderItem[]
}

// 請求書データの型定義
interface InvoiceItem {
  id: number
  itemCode: string
  itemName: string
  quantity: number
  unitPrice: number
  amount: number
  taxRate: number
  taxAmount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: Date
  vendorId: string
  vendorName: string
  dueDate: Date
  totalAmount: number
  taxAmount: number
  totalWithTax: number
  status: string
  items: InvoiceItem[]
  matchStatus?: "pending" | "matched" | "partial" | "mismatch"
}

// マッチング結果の型定義
interface MatchingResult {
  purchaseOrder: PurchaseOrder
  invoice: Invoice
  itemMatches: ItemMatchResult[]
  headerMatches: {
    vendorMatch: boolean
    amountMatch: boolean
    dateMatch: boolean
  }
  overallStatus: "matched" | "partial" | "mismatch"
}

interface ItemMatchResult {
  purchaseOrderItem: PurchaseOrderItem | null
  invoiceItem: InvoiceItem | null
  itemCodeMatch: boolean
  quantityMatch: boolean
  unitPriceMatch: boolean
  amountMatch: boolean
  status: "matched" | "partial" | "mismatch" | "extra" | "missing"
}

// フォームのスキーマ定義
const uploadFormSchema = z.object({
  purchaseOrderId: z.string().min(1, { message: "発注書を選択してください" }),
  invoiceFile: z.any().optional(),
})

// サンプルデータ
const samplePurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-001",
    orderNumber: "PO-2023-0459",
    orderDate: new Date(2023, 11, 15),
    vendorId: "v-001",
    vendorName: "株式会社山田製作所",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 22),
    departmentId: "d-001",
    departmentName: "製造部",
    personInChargeId: "p-001",
    personInChargeName: "田中 健太",
    status: "approved",
    totalAmount: 16500,
    items: [
      {
        id: 1,
        itemCode: "ITM001",
        itemName: "アルミ板 A4052 t5.0",
        quantity: 10,
        unitPrice: 1500,
        amount: 15000,
        warehouseCode: "WH001",
        warehouseName: "本社倉庫",
      },
      {
        id: 2,
        itemCode: "ITM003",
        itemName: "六角ボルト M10×30",
        quantity: 5,
        unitPrice: 300,
        amount: 1500,
        warehouseCode: "WH001",
        warehouseName: "本社倉庫",
      },
    ],
  },
  {
    id: "po-002",
    orderNumber: "PO-2023-0458",
    orderDate: new Date(2023, 11, 14),
    vendorId: "v-003",
    vendorName: "大阪金属工業株式会社",
    orderType: "urgent",
    orderTypeLabel: "緊急発注",
    deliveryDate: new Date(2023, 11, 16),
    departmentId: "d-001",
    departmentName: "製造部",
    personInChargeId: "p-001",
    personInChargeName: "田中 健太",
    status: "completed",
    totalAmount: 45000,
    items: [
      {
        id: 1,
        itemCode: "ITM005",
        itemName: "シリコンゴムシート t1.0",
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
        warehouseCode: "WH001",
        warehouseName: "本社倉庫",
      },
      {
        id: 2,
        itemCode: "ITM006",
        itemName: "ステンレス板 SUS304 t2.0",
        quantity: 2,
        unitPrice: 15000,
        amount: 30000,
        warehouseCode: "WH001",
        warehouseName: "本社倉庫",
      },
    ],
  },
]

// サンプル請求書データ（OCR処理後のデータを想定）
const sampleInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-20231220-001",
    invoiceDate: new Date(2023, 11, 20),
    vendorId: "v-001",
    vendorName: "株式会社山田製作所",
    dueDate: new Date(2024, 0, 20),
    totalAmount: 16500,
    taxAmount: 1650,
    totalWithTax: 18150,
    status: "pending",
    items: [
      {
        id: 1,
        itemCode: "ITM001",
        itemName: "アルミ板 A4052 t5.0",
        quantity: 10,
        unitPrice: 1500,
        amount: 15000,
        taxRate: 10,
        taxAmount: 1500,
      },
      {
        id: 2,
        itemCode: "ITM003",
        itemName: "六角ボルト M10×30",
        quantity: 5,
        unitPrice: 300,
        amount: 1500,
        taxRate: 10,
        taxAmount: 150,
      },
    ],
    matchStatus: "pending",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-20231217-002",
    invoiceDate: new Date(2023, 11, 17),
    vendorId: "v-003",
    vendorName: "大阪金属工業株式会社",
    dueDate: new Date(2024, 0, 17),
    totalAmount: 46000, // 金額が異なる
    taxAmount: 4600,
    totalWithTax: 50600,
    status: "pending",
    items: [
      {
        id: 1,
        itemCode: "ITM005",
        itemName: "シリコンゴムシート t1.0",
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
        taxRate: 10,
        taxAmount: 1500,
      },
      {
        id: 2,
        itemCode: "ITM006",
        itemName: "ステンレス板 SUS304 t2.0",
        quantity: 2,
        unitPrice: 15500, // 単価が異なる
        amount: 31000, // 金額が異なる
        taxRate: 10,
        taxAmount: 3100,
      },
    ],
    matchStatus: "mismatch",
  },
]

export default function InvoiceMatchingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showMatchingDialog, setShowMatchingDialog] = useState(false)
  const [matchingTab, setMatchingTab] = useState("summary")

  // フォーム初期化
  const form = useForm<z.infer<typeof uploadFormSchema>>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      purchaseOrderId: "",
    },
  })

  // 発注書選択時の処理
  const handlePurchaseOrderSelect = (purchaseOrderId: string) => {
    const purchaseOrder = samplePurchaseOrders.find((po) => po.id === purchaseOrderId)
    if (purchaseOrder) {
      setSelectedPurchaseOrder(purchaseOrder)
      // 関連する請求書を自動検索（実際のアプリではAPIで取得）
      const relatedInvoice = sampleInvoices.find((inv) => inv.vendorId === purchaseOrder.vendorId)
      setSelectedInvoice(relatedInvoice || null)
    } else {
      setSelectedPurchaseOrder(null)
      setSelectedInvoice(null)
    }
  }

  // ファイルアップロード処理
  const handleFileUpload = (file: File) => {
    if (!file || !selectedPurchaseOrder) return

    setIsUploading(true)
    setUploadProgress(0)

    // アップロード進捗のシミュレーション
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          setIsProcessing(true)

          // OCR処理完了後のシミュレーション
          setTimeout(() => {
            setIsProcessing(false)
            // 選択された発注書に対応する請求書を取得（実際はOCR結果）
            const invoice = sampleInvoices.find((inv) => inv.vendorId === selectedPurchaseOrder.vendorId)
            if (invoice) {
              setSelectedInvoice(invoice)
              performMatching(selectedPurchaseOrder, invoice)
            }
          }, 2000)

          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  // フォーム送信処理
  const onSubmit = (data: z.infer<typeof uploadFormSchema>) => {
    const purchaseOrderId = data.purchaseOrderId
    handlePurchaseOrderSelect(purchaseOrderId)

    const fileInput = document.getElementById("invoice-file") as HTMLInputElement
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0])
    } else if (selectedPurchaseOrder && selectedInvoice) {
      // ファイルがない場合でも、選択された発注書と請求書でマッチングを実行
      performMatching(selectedPurchaseOrder, selectedInvoice)
    }
  }

  // マッチング処理
  const performMatching = (purchaseOrder: PurchaseOrder, invoice: Invoice) => {
    // ヘッダー情報のマッチング
    const vendorMatch = purchaseOrder.vendorId === invoice.vendorId
    const amountMatch = Math.abs(purchaseOrder.totalAmount - invoice.totalAmount) < 0.01
    const dateMatch =
      Math.abs(purchaseOrder.deliveryDate.getTime() - invoice.invoiceDate.getTime()) < 7 * 24 * 60 * 60 * 1000 // 1週間以内

    // 明細のマッチング
    const itemMatches: ItemMatchResult[] = []

    // 発注明細ごとにマッチングを実行
    purchaseOrder.items.forEach((poItem) => {
      const matchingInvoiceItem = invoice.items.find((invItem) => invItem.itemCode === poItem.itemCode)

      if (matchingInvoiceItem) {
        const itemCodeMatch = poItem.itemCode === matchingInvoiceItem.itemCode
        const quantityMatch = poItem.quantity === matchingInvoiceItem.quantity
        const unitPriceMatch = Math.abs(poItem.unitPrice - matchingInvoiceItem.unitPrice) < 0.01
        const amountMatch = Math.abs(poItem.amount - matchingInvoiceItem.amount) < 0.01

        let status: "matched" | "partial" | "mismatch"
        if (itemCodeMatch && quantityMatch && unitPriceMatch && amountMatch) {
          status = "matched"
        } else if (itemCodeMatch && (quantityMatch || unitPriceMatch || amountMatch)) {
          status = "partial"
        } else {
          status = "mismatch"
        }

        itemMatches.push({
          purchaseOrderItem: poItem,
          invoiceItem: matchingInvoiceItem,
          itemCodeMatch,
          quantityMatch,
          unitPriceMatch,
          amountMatch,
          status,
        })
      } else {
        // 発注明細に対応する請求書明細がない場合
        itemMatches.push({
          purchaseOrderItem: poItem,
          invoiceItem: null,
          itemCodeMatch: false,
          quantityMatch: false,
          unitPriceMatch: false,
          amountMatch: false,
          status: "missing",
        })
      }
    })

    // 請求書明細で、発注明細に対応しないものを追加
    invoice.items.forEach((invItem) => {
      const hasMatchingPoItem = purchaseOrder.items.some((poItem) => poItem.itemCode === invItem.itemCode)
      if (!hasMatchingPoItem) {
        itemMatches.push({
          purchaseOrderItem: null,
          invoiceItem: invItem,
          itemCodeMatch: false,
          quantityMatch: false,
          unitPriceMatch: false,
          amountMatch: false,
          status: "extra",
        })
      }
    })

    // 全体的なマッチング状態を判定
    let overallStatus: "matched" | "partial" | "mismatch"
    const allMatched = itemMatches.every((match) => match.status === "matched")
    const anyMismatch = itemMatches.some(
      (match) => match.status === "mismatch" || match.status === "extra" || match.status === "missing",
    )

    if (allMatched && vendorMatch && amountMatch) {
      overallStatus = "matched"
    } else if (anyMismatch || !vendorMatch) {
      overallStatus = "mismatch"
    } else {
      overallStatus = "partial"
    }

    const result: MatchingResult = {
      purchaseOrder,
      invoice,
      itemMatches,
      headerMatches: {
        vendorMatch,
        amountMatch,
        dateMatch,
      },
      overallStatus,
    }

    setMatchingResult(result)
    setShowMatchingDialog(true)
  }

  // マッチング結果の承認処理
  const handleApproveMatching = () => {
    if (!matchingResult) return

    // 実際のアプリではAPIを呼び出して承認処理を行う
    alert("マッチング結果を承認しました。請求処理に進みます。")
    setShowMatchingDialog(false)
    router.push("/invoice-processing")
  }

  // マッチング結果の拒否処理
  const handleRejectMatching = () => {
    if (!matchingResult) return

    // 実際のアプリではAPIを呼び出して拒否処理を行う
    alert("マッチング結果を拒否しました。請求書を確認してください。")
    setShowMatchingDialog(false)
  }

  // ステータスに応じたバッジの色を取得
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "matched":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "mismatch":
        return "bg-red-100 text-red-800"
      case "extra":
        return "bg-purple-100 text-purple-800"
      case "missing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // ステータスに応じたラベルを取得
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "matched":
        return "一致"
      case "partial":
        return "部分一致"
      case "mismatch":
        return "不一致"
      case "extra":
        return "追加項目"
      case "missing":
        return "欠落項目"
      default:
        return status
    }
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">請求書マッチング</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* 左側：発注書選択と請求書アップロード */}
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>請求書マッチング</CardTitle>
              <CardDescription>発注書を選択し、請求書をアップロードして突合処理を行います。</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="purchaseOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>発注書選択</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            handlePurchaseOrderSelect(value)
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="発注書を選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {samplePurchaseOrders.map((po) => (
                              <SelectItem key={po.id} value={po.id}>
                                {po.orderNumber} - {po.vendorName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel htmlFor="invoice-file">請求書アップロード</FormLabel>
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <Input
                        id="invoice-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            form.setValue("invoiceFile", e.target.files[0])
                          }
                        }}
                      />
                      <label
                        htmlFor="invoice-file"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">クリックして請求書をアップロード</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNGファイルに対応</p>
                      </label>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">アップロード中...</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {isProcessing && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">OCR処理中...</p>
                      <Progress value={undefined} className="h-2" />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isUploading || isProcessing}>
                    {selectedInvoice ? "マッチング実行" : "アップロードしてマッチング"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {selectedPurchaseOrder && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>選択中の発注書</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">発注番号</p>
                      <p className="font-medium">{selectedPurchaseOrder.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">発注日</p>
                      <p className="font-medium">
                        {format(selectedPurchaseOrder.orderDate, "yyyy/MM/dd", { locale: ja })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">取引先</p>
                    <p className="font-medium">{selectedPurchaseOrder.vendorName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">発注形態</p>
                      <p className="font-medium">{selectedPurchaseOrder.orderTypeLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">納期</p>
                      <p className="font-medium">
                        {format(selectedPurchaseOrder.deliveryDate, "yyyy/MM/dd", { locale: ja })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">合計金額</p>
                    <p className="font-medium">{selectedPurchaseOrder.totalAmount.toLocaleString()} 円</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：発注明細と請求書明細 */}
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>発注明細</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPurchaseOrder ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>品目コード</TableHead>
                        <TableHead>品目名</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">単価</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchaseOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemCode}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-medium">
                          合計:
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {selectedPurchaseOrder.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">発注書を選択してください</div>
              )}
            </CardContent>
          </Card>

          {selectedInvoice && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>請求書明細</CardTitle>
                {selectedInvoice.matchStatus && (
                  <Badge className={getStatusBadgeColor(selectedInvoice.matchStatus)}>
                    {getStatusLabel(selectedInvoice.matchStatus)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">請求書番号</p>
                      <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">請求日</p>
                      <p className="font-medium">{format(selectedInvoice.invoiceDate, "yyyy/MM/dd", { locale: ja })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">支払期限</p>
                      <p className="font-medium">{format(selectedInvoice.dueDate, "yyyy/MM/dd", { locale: ja })}</p>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>品目コード</TableHead>
                          <TableHead>品目名</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">単価</TableHead>
                          <TableHead className="text-right">金額</TableHead>
                          <TableHead className="text-right">税率</TableHead>
                          <TableHead className="text-right">税額</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.itemCode}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.taxRate}%</TableCell>
                            <TableCell className="text-right">{item.taxAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-medium">
                            小計:
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {selectedInvoice.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-medium">
                            消費税:
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {selectedInvoice.taxAmount.toLocaleString()}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-medium">
                            合計:
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {selectedInvoice.totalWithTax.toLocaleString()}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={() => performMatching(selectedPurchaseOrder!, selectedInvoice)}>マッチング実行</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* マッチング結果ダイアログ */}
      <Dialog open={showMatchingDialog} onOpenChange={setShowMatchingDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              マッチング結果
              {matchingResult && (
                <Badge className={getStatusBadgeColor(matchingResult.overallStatus)}>
                  {getStatusLabel(matchingResult.overallStatus)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>発注書と請求書のマッチング結果を確認してください。</DialogDescription>
          </DialogHeader>

          {matchingResult && (
            <div className="mt-4">
              <Tabs value={matchingTab} onValueChange={setMatchingTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">サマリー</TabsTrigger>
                  <TabsTrigger value="details">詳細</TabsTrigger>
                  <TabsTrigger value="actions">アクション</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">発注書情報</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">発注番号</p>
                            <p className="font-medium">{matchingResult.purchaseOrder.orderNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">発注日</p>
                            <p className="font-medium">
                              {format(matchingResult.purchaseOrder.orderDate, "yyyy/MM/dd", { locale: ja })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">取引先</p>
                          <p className="font-medium">{matchingResult.purchaseOrder.vendorName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">合計金額</p>
                          <p className="font-medium">{matchingResult.purchaseOrder.totalAmount.toLocaleString()} 円</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">請求書情報</h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">請求書番号</p>
                            <p className="font-medium">{matchingResult.invoice.invoiceNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">請求日</p>
                            <p className="font-medium">
                              {format(matchingResult.invoice.invoiceDate, "yyyy/MM/dd", { locale: ja })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">取引先</p>
                          <p className={cn("font-medium", !matchingResult.headerMatches.vendorMatch && "text-red-500")}>
                            {matchingResult.invoice.vendorName}
                            {!matchingResult.headerMatches.vendorMatch && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 ml-1 inline" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>取引先が一致しません</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">合計金額</p>
                          <p className={cn("font-medium", !matchingResult.headerMatches.amountMatch && "text-red-500")}>
                            {matchingResult.invoice.totalAmount.toLocaleString()} 円
                            {!matchingResult.headerMatches.amountMatch && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 ml-1 inline" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>金額が一致しません</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert
                    className={cn(
                      matchingResult.overallStatus === "matched"
                        ? "bg-green-50"
                        : matchingResult.overallStatus === "partial"
                          ? "bg-yellow-50"
                          : "bg-red-50",
                    )}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>マッチング結果</AlertTitle>
                    <AlertDescription>
                      {matchingResult.overallStatus === "matched" && "発注書と請求書は完全に一致しています。"}
                      {matchingResult.overallStatus === "partial" &&
                        "発注書と請求書は部分的に一致しています。詳細を確認してください。"}
                      {matchingResult.overallStatus === "mismatch" &&
                        "発注書と請求書に不一致があります。詳細を確認してください。"}
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-lg font-medium mb-2">マッチング概要</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-8">
                          {matchingResult.headerMatches.vendorMatch ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p>取引先情報</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8">
                          {matchingResult.headerMatches.amountMatch ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p>合計金額</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8">
                          {matchingResult.headerMatches.dateMatch ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <p>日付情報</p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8">
                          {matchingResult.itemMatches.every((m) => m.status === "matched") ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : matchingResult.itemMatches.some(
                              (m) => m.status === "mismatch" || m.status === "extra" || m.status === "missing",
                            ) ? (
                            <X className="h-5 w-5 text-red-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        <p>明細情報</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>品目コード</TableHead>
                          <TableHead>品目名</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">単価</TableHead>
                          <TableHead className="text-right">金額</TableHead>
                          <TableHead>ステータス</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchingResult.itemMatches.map((match, index) => (
                          <TableRow
                            key={index}
                            className={
                              match.status === "matched"
                                ? "bg-green-50"
                                : match.status === "partial"
                                  ? "bg-yellow-50"
                                  : match.status === "mismatch"
                                    ? "bg-red-50"
                                    : match.status === "extra"
                                      ? "bg-purple-50"
                                      : match.status === "missing"
                                        ? "bg-blue-50"
                                        : ""
                            }
                          >
                            <TableCell>
                              {match.purchaseOrderItem?.itemCode || match.invoiceItem?.itemCode || "-"}
                              {match.purchaseOrderItem && match.invoiceItem && !match.itemCodeMatch && (
                                <div className="text-xs text-red-500 mt-1">
                                  {match.purchaseOrderItem.itemCode} ≠ {match.invoiceItem.itemCode}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {match.purchaseOrderItem?.itemName || match.invoiceItem?.itemName || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {match.purchaseOrderItem?.quantity || match.invoiceItem?.quantity || "-"}
                              {match.purchaseOrderItem && match.invoiceItem && !match.quantityMatch && (
                                <div className="text-xs text-red-500 mt-1">
                                  {match.purchaseOrderItem.quantity} ≠ {match.invoiceItem.quantity}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {(
                                match.purchaseOrderItem?.unitPrice ||
                                match.invoiceItem?.unitPrice ||
                                0
                              ).toLocaleString()}
                              {match.purchaseOrderItem && match.invoiceItem && !match.unitPriceMatch && (
                                <div className="text-xs text-red-500 mt-1">
                                  {match.purchaseOrderItem.unitPrice.toLocaleString()} ≠{" "}
                                  {match.invoiceItem.unitPrice.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {(match.purchaseOrderItem?.amount || match.invoiceItem?.amount || 0).toLocaleString()}
                              {match.purchaseOrderItem && match.invoiceItem && !match.amountMatch && (
                                <div className="text-xs text-red-500 mt-1">
                                  {match.purchaseOrderItem.amount.toLocaleString()} ≠{" "}
                                  {match.invoiceItem.amount.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(match.status)}>
                                {getStatusLabel(match.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="actions">
                  <div className="space-y-4">
                    <Alert
                      className={
                        matchingResult.overallStatus === "matched"
                          ? "bg-green-50"
                          : matchingResult.overallStatus === "partial"
                            ? "bg-yellow-50"
                            : "bg-red-50"
                      }
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>処理アクション</AlertTitle>
                      <AlertDescription>
                        {matchingResult.overallStatus === "matched" &&
                          "発注書と請求書は完全に一致しています。承認して処理を進めることができます。"}
                        {matchingResult.overallStatus === "partial" &&
                          "発注書と請求書は部分的に一致しています。差異を確認して承認するか、修正が必要です。"}
                        {matchingResult.overallStatus === "mismatch" &&
                          "発注書と請求書に不一致があります。差異を確認して修正するか、拒否してください。"}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">アクション選択</h3>
                      <p className="text-sm text-muted-foreground">
                        マッチング結果に基づいて、以下のアクションを選択してください。
                      </p>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <Button
                          onClick={handleApproveMatching}
                          variant={matchingResult.overallStatus === "matched" ? "default" : "outline"}
                          className={
                            matchingResult.overallStatus === "matched" ? "" : "border-yellow-500 text-yellow-700"
                          }
                        >
                          <Check className="mr-2 h-4 w-4" />
                          承認して処理
                        </Button>
                        <Button
                          onClick={handleRejectMatching}
                          variant="outline"
                          className="border-red-500 text-red-700"
                        >
                          <X className="mr-2 h-4 w-4" />
                          拒否して修正
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchingDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
