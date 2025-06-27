"use client"

import { DialogFooter } from "@/components/ui/dialog"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Edit, Eye, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// 発注明細の型定義
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

// 請求書明細の型定義
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

// マッチング結果明細の型定義
interface MatchingResultItem {
  id: string
  purchaseOrderItemId?: number
  invoiceItemId?: number
  purchaseOrderItem?: PurchaseOrderItem
  invoiceItem?: InvoiceItem
  status: "matched" | "partial_match" | "mismatch" | "po_only" | "invoice_only"
  differences: {
    itemCode?: boolean
    itemName?: boolean
    quantity?: boolean
    unitPrice?: boolean
    amount?: boolean
  }
}

// マッチング結果の型定義
interface MatchingResult {
  id: string
  purchaseOrderId: string
  purchaseOrderNumber: string
  invoiceId: string
  invoiceNumber: string
  vendorId: string
  vendorName: string
  matchingDate: Date
  status: "matched" | "partial_match" | "mismatch"
  matchRate: number
  poAmount: number
  invoiceAmount: number
  amountDifference: number
  itemCount: number
  matchedItemCount: number
  currency: string
  processingStatus: "pending" | "approved" | "rejected" | "modified"
  processingDate?: Date
  processedBy?: string
  items: MatchingResultItem[]
  purchaseOrderData: {
    orderDate: Date
    deliveryDate: Date
    departmentName: string
    personInChargeName: string
    paymentTerms: string
  }
  invoiceData: {
    invoiceDate: Date
    dueDate: Date
    taxAmount: number
    totalWithTax: number
    paymentTerms: string
    imageUrl: string
  }
}

// サンプルデータ
const sampleMatchingResult: MatchingResult = {
  id: "match-002",
  purchaseOrderId: "po-002",
  purchaseOrderNumber: "PO-2023-0458",
  invoiceId: "inv-002",
  invoiceNumber: "INV-20231217-002",
  vendorId: "v-003",
  vendorName: "大阪金属工業株式会社",
  matchingDate: new Date(2023, 11, 18),
  status: "partial_match",
  matchRate: 75,
  poAmount: 45000,
  invoiceAmount: 46000,
  amountDifference: 1000,
  itemCount: 2,
  matchedItemCount: 1,
  currency: "JPY",
  processingStatus: "pending",
  purchaseOrderData: {
    orderDate: new Date(2023, 11, 14),
    deliveryDate: new Date(2023, 11, 16),
    departmentName: "製造部",
    personInChargeName: "田中 健太",
    paymentTerms: "30日以内",
  },
  invoiceData: {
    invoiceDate: new Date(2023, 11, 17),
    dueDate: new Date(2024, 0, 17),
    taxAmount: 4600,
    totalWithTax: 50600,
    paymentTerms: "30日以内",
    imageUrl: "/placeholder.svg?height=600&width=400",
  },
  items: [
    {
      id: "match-item-001",
      purchaseOrderItemId: 1,
      invoiceItemId: 1,
      purchaseOrderItem: {
        id: 1,
        itemCode: "ITM005",
        itemName: "シリコンゴムシート t1.0",
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
        warehouseCode: "WH001",
        warehouseName: "本社倉庫",
      },
      invoiceItem: {
        id: 1,
        itemCode: "ITM005",
        itemName: "シリコンゴムシート t1.0",
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
        taxRate: 10,
        taxAmount: 1500,
      },
      status: "matched",
      differences: {},
    },
    {
      id: "match-item-002",
      purchaseOrderItemId: 2,
      invoiceItemId: 2,
      purchaseOrderItem: {
        id: 2,
        itemCode: "ITM006",
        itemName: "ステンレス板 SUS304 t2.0",
        quantity: 2,
        unitPrice: 15000,
        amount: 30000,
        warehouseCode: "WH001",
        warehouseName: "本社倉庫",
      },
      invoiceItem: {
        id: 2,
        itemCode: "ITM006",
        itemName: "ステンレス板 SUS304 t2.0",
        quantity: 2,
        unitPrice: 15500, // 単価が異なる
        amount: 31000, // 金額が異なる
        taxRate: 10,
        taxAmount: 3100,
      },
      status: "partial_match",
      differences: {
        unitPrice: true,
        amount: true,
      },
    },
  ],
}

export default function InvoiceMatchingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [matchingResult, setMatchingResult] = useState<MatchingResult>(sampleMatchingResult)
  const [currentTab, setCurrentTab] = useState("summary")
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showInvoiceImageDialog, setShowInvoiceImageDialog] = useState(false)

  // 実際のアプリケーションでは、IDを使用してAPIからデータを取得
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch(`/api/invoice-matching/${params.id}`);
  //       const data = await response.json();
  //       setMatchingResult(data);
  //     } catch (error) {
  //       console.error("Error fetching matching result:", error);
  //     }
  //   };
  //   fetchData();
  // }, [params.id]);

  // ステータスに応じたバッジの色を取得
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "matched":
        return "bg-green-100 text-green-800"
      case "partial_match":
        return "bg-yellow-100 text-yellow-800"
      case "mismatch":
        return "bg-red-100 text-red-800"
      case "po_only":
        return "bg-blue-100 text-blue-800"
      case "invoice_only":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // ステータスに応じたラベルを取得
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "matched":
        return "完全一致"
      case "partial_match":
        return "部分一致"
      case "mismatch":
        return "不一致"
      case "po_only":
        return "発注のみ"
      case "invoice_only":
        return "請求書のみ"
      default:
        return status
    }
  }

  // 承認処理
  const handleApprove = () => {
    // 実際のアプリケーションではAPIを呼び出して承認処理
    alert("マッチング結果を承認しました")
    setShowApproveDialog(false)
    router.push("/invoice-matching/list")
  }

  // 差し戻し処理
  const handleReject = () => {
    // 実際のアプリケーションではAPIを呼び出して差し戻し処理
    alert("マッチング結果を差し戻しました")
    setShowRejectDialog(false)
    router.push("/invoice-matching/list")
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/invoice-matching/list">
              <ArrowLeft className="mr-2 h-4 w-4" />
              一覧に戻る
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">マッチング詳細</h1>
          <Badge className={cn("ml-4", getStatusBadgeColor(matchingResult.status))}>
            {getStatusLabel(matchingResult.status)}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 発注情報 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                発注情報
              </CardTitle>
              <CardDescription>発注番号: {matchingResult.purchaseOrderNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">取引先</p>
                  <p className="font-medium">{matchingResult.vendorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">発注日</p>
                  <p className="font-medium">
                    {format(matchingResult.purchaseOrderData.orderDate, "yyyy年MM月dd日", { locale: ja })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">納期</p>
                  <p className="font-medium">
                    {format(matchingResult.purchaseOrderData.deliveryDate, "yyyy年MM月dd日", { locale: ja })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">発注金額</p>
                  <p className="font-medium">{matchingResult.poAmount.toLocaleString()}円</p>
                </div>
                <div>
                  <p className="text-muted-foreground">担当部門</p>
                  <p className="font-medium">{matchingResult.purchaseOrderData.departmentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">担当者</p>
                  <p className="font-medium">{matchingResult.purchaseOrderData.personInChargeName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 請求書情報 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                請求書情報
              </CardTitle>
              <CardDescription>請求書番号: {matchingResult.invoiceNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">取引先</p>
                  <p className="font-medium">{matchingResult.vendorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">請求日</p>
                  <p className="font-medium">
                    {format(matchingResult.invoiceData.invoiceDate, "yyyy年MM月dd日", { locale: ja })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">支払期限</p>
                  <p className="font-medium">
                    {format(matchingResult.invoiceData.dueDate, "yyyy年MM月dd日", { locale: ja })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">請求金額（税込）</p>
                  <p className="font-medium">{matchingResult.invoiceData.totalWithTax.toLocaleString()}円</p>
                </div>
                <div>
                  <p className="text-muted-foreground">税抜金額</p>
                  <p className="font-medium">{matchingResult.invoiceAmount.toLocaleString()}円</p>
                </div>
                <div>
                  <p className="text-muted-foreground">消費税</p>
                  <p className="font-medium">{matchingResult.invoiceData.taxAmount.toLocaleString()}円</p>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowInvoiceImageDialog(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  請求書画像を表示
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* マッチング結果サマリー */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">マッチング結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="flex flex-col items-center p-3 rounded-md bg-muted/30">
                <span className="text-sm text-muted-foreground">全項目</span>
                <span className="text-2xl font-bold">{matchingResult.itemCount}</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md bg-green-50">
                <span className="text-sm text-green-600">一致</span>
                <span className="text-2xl font-bold text-green-600">
                  {matchingResult.items.filter((item) => item.status === "matched").length}
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md bg-yellow-50">
                <span className="text-sm text-yellow-600">部分一致</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {matchingResult.items.filter((item) => item.status === "partial_match").length}
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md bg-red-50">
                <span className="text-sm text-red-600">不一致</span>
                <span className="text-2xl font-bold text-red-600">
                  {matchingResult.items.filter((item) => item.status === "mismatch").length}
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md bg-blue-50">
                <span className="text-sm text-blue-600">一致率</span>
                <span className="text-2xl font-bold text-blue-600">{matchingResult.matchRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* マッチング詳細 */}
        <Card className="mt-6">
          <Tabs defaultValue="summary" value={currentTab} onValueChange={setCurrentTab}>
            <CardHeader className="pb-2">
              <TabsList>
                <TabsTrigger value="summary">サマリー</TabsTrigger>
                <TabsTrigger value="details">明細比較</TabsTrigger>
                <TabsTrigger value="actions">アクション</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="summary" className="mt-0">
                <div className="space-y-4">
                  <Alert
                    className={cn(
                      matchingResult.status === "matched"
                        ? "bg-green-50"
                        : matchingResult.status === "partial_match"
                          ? "bg-yellow-50"
                          : "bg-red-50",
                    )}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>マッチング結果</AlertTitle>
                    <AlertDescription>
                      {matchingResult.status === "matched" && "発注書と請求書は完全に一致しています。"}
                      {matchingResult.status === "partial_match" &&
                        "発注書と請求書は部分的に一致しています。詳細を確認してください。"}
                      {matchingResult.status === "mismatch" &&
                        "発注書と請求書に不一致があります。詳細を確認してください。"}
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">金額比較</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>発注金額:</span>
                          <span className="font-medium">{matchingResult.poAmount.toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>請求金額:</span>
                          <span className="font-medium">{matchingResult.invoiceAmount.toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>差額:</span>
                          <span
                            className={cn("font-medium", matchingResult.amountDifference !== 0 ? "text-red-600" : "")}
                          >
                            {matchingResult.amountDifference === 0
                              ? "-"
                              : `${matchingResult.amountDifference > 0 ? "+" : ""}${matchingResult.amountDifference.toLocaleString()} 円`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">マッチング概要</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-8">
                            {matchingResult.vendorName ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <p>取引先情報</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8">
                            {matchingResult.amountDifference === 0 ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <p>合計金額</p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8">
                            <Progress value={matchingResult.matchRate} className="h-2 w-20" />
                          </div>
                          <p>明細一致率: {matchingResult.matchRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ステータス</TableHead>
                        <TableHead>品目コード</TableHead>
                        <TableHead>品目名</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">単価</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead>差異</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchingResult.items.map((item) => (
                        <React.Fragment key={item.id}>
                          <TableRow
                            className={cn(
                              item.status === "matched"
                                ? "bg-green-50"
                                : item.status === "partial_match"
                                  ? "bg-yellow-50"
                                  : item.status === "mismatch"
                                    ? "bg-red-50"
                                    : item.status === "po_only"
                                      ? "bg-blue-50"
                                      : "bg-purple-50",
                            )}
                          >
                            <TableCell>
                              <Badge className={getStatusBadgeColor(item.status)}>{getStatusLabel(item.status)}</Badge>
                            </TableCell>
                            <TableCell>
                              {item.purchaseOrderItem?.itemCode || "-"}
                              {item.invoiceItem && item.differences.itemCode && (
                                <div className="text-xs text-red-500 mt-1">請求書: {item.invoiceItem.itemCode}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.purchaseOrderItem?.itemName || "-"}
                              {item.invoiceItem && item.differences.itemName && (
                                <div className="text-xs text-red-500 mt-1">請求書: {item.invoiceItem.itemName}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.purchaseOrderItem?.quantity.toLocaleString() || "-"}
                              {item.invoiceItem && item.differences.quantity && (
                                <div className="text-xs text-red-500 mt-1">
                                  請求書: {item.invoiceItem.quantity.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.purchaseOrderItem?.unitPrice.toLocaleString() || "-"}
                              {item.invoiceItem && item.differences.unitPrice && (
                                <div className="text-xs text-red-500 mt-1">
                                  請求書: {item.invoiceItem.unitPrice.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.purchaseOrderItem?.amount.toLocaleString() || "-"}
                              {item.invoiceItem && item.differences.amount && (
                                <div className="text-xs text-red-500 mt-1">
                                  請求書: {item.invoiceItem.amount.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.status === "matched" ? (
                                <span className="text-green-600">差異なし</span>
                              ) : item.status === "partial_match" ? (
                                <div className="text-yellow-600">
                                  {item.differences.itemCode && "品目コード, "}
                                  {item.differences.itemName && "品目名, "}
                                  {item.differences.quantity && "数量, "}
                                  {item.differences.unitPrice && "単価, "}
                                  {item.differences.amount && "金額"}
                                </div>
                              ) : item.status === "po_only" ? (
                                <span className="text-blue-600">発注のみ存在</span>
                              ) : item.status === "invoice_only" ? (
                                <span className="text-purple-600">請求書のみ存在</span>
                              ) : (
                                <span className="text-red-600">完全不一致</span>
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-0">
                <div className="space-y-4">
                  <Alert
                    className={
                      matchingResult.status === "matched"
                        ? "bg-green-50"
                        : matchingResult.status === "partial_match"
                          ? "bg-yellow-50"
                          : "bg-red-50"
                    }
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>処理アクション</AlertTitle>
                    <AlertDescription>
                      {matchingResult.status === "matched" &&
                        "発注書と請求書は完全に一致しています。承認して処理を進めることができます。"}
                      {matchingResult.status === "partial_match" &&
                        "発注書と請求書は部分的に一致しています。差異を確認して承認するか、修正が必要です。"}
                      {matchingResult.status === "mismatch" &&
                        "発注書と請求書に不一致があります。差異を確認して修正するか、拒否してください。"}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">アクション選択</h3>
                    <p className="text-sm text-muted-foreground">
                      マッチング結果に基づいて、以下のアクションを選択してください。
                    </p>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <Button
                        onClick={() => setShowApproveDialog(true)}
                        variant={matchingResult.status === "matched" ? "default" : "outline"}
                        className={matchingResult.status === "matched" ? "" : "border-yellow-500 text-yellow-700"}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        承認して処理
                      </Button>
                      <Button
                        onClick={() => setShowRejectDialog(true)}
                        variant="outline"
                        className="border-red-500 text-red-700"
                      >
                        <X className="mr-2 h-4 w-4" />
                        差し戻し
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/invoice-matching/edit/${matchingResult.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          発注データを修正
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* 承認ダイアログ */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>マッチング結果の承認</DialogTitle>
            <DialogDescription>このマッチング結果を承認しますか？承認すると、請求処理に進みます。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {matchingResult.status !== "matched" && (
              <Alert className="bg-yellow-50 mb-4">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-600">注意</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  このマッチング結果には差異があります。それでも承認しますか？
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">マッチング概要</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">発注番号: </span>
                  <span>{matchingResult.purchaseOrderNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">請求書番号: </span>
                  <span>{matchingResult.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">発注金額: </span>
                  <span>{matchingResult.poAmount.toLocaleString()}円</span>
                </div>
                <div>
                  <span className="text-muted-foreground">請求金額: </span>
                  <span>{matchingResult.invoiceAmount.toLocaleString()}円</span>
                </div>
                <div>
                  <span className="text-muted-foreground">一致率: </span>
                  <span>{matchingResult.matchRate}%</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApprove}>承認する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 差し戻しダイアログ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>マッチング結果の差し戻し</DialogTitle>
            <DialogDescription>
              このマッチング結果を差し戻しますか？差し戻すと、請求書の再確認が必要になります。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">マッチング概要</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">発注番号: </span>
                  <span>{matchingResult.purchaseOrderNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">請求書番号: </span>
                  <span>{matchingResult.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">発注金額: </span>
                  <span>{matchingResult.poAmount.toLocaleString()}円</span>
                </div>
                <div>
                  <span className="text-muted-foreground">請求金額: </span>
                  <span>{matchingResult.invoiceAmount.toLocaleString()}円</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              差し戻す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 請求書画像ダイアログ */}
      <Dialog open={showInvoiceImageDialog} onOpenChange={setShowInvoiceImageDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>請求書画像</DialogTitle>
            <DialogDescription>請求書番号: {matchingResult.invoiceNumber}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={matchingResult.invoiceData.imageUrl || "/placeholder.svg"}
              alt="請求書画像"
              className="max-h-[70vh] border rounded-md"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceImageDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
