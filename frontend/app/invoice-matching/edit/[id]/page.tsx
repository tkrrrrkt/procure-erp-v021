"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { AlertCircle, ArrowLeft, Eye, FileText, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

export default function InvoiceMatchingEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [matchingResult, setMatchingResult] = useState<MatchingResult>(sampleMatchingResult)
  const [editedItems, setEditedItems] = useState<Record<string, PurchaseOrderItem>>({})
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showInvoiceImageDialog, setShowInvoiceImageDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 実際のアプリケーションでは、IDを使用してAPIからデータを取得
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch(`/api/invoice-matching/${params.id}`);
  //       const data = await response.json();
  //       setMatchingResult(data);
  //
  //       // 編集用の初期データを設定
  //       const initialEditedItems: Record<string, PurchaseOrderItem> = {};
  //       data.items.forEach(item => {
  //         if (item.purchaseOrderItem) {
  //           initialEditedItems[item.id] = { ...item.purchaseOrderItem };
  //         }
  //       });
  //       setEditedItems(initialEditedItems);
  //     } catch (error) {
  //       console.error("Error fetching matching result:", error);
  //     }
  //   };
  //   fetchData();
  // }, [params.id]);

  // 初期化
  useState(() => {
    const initialEditedItems: Record<string, PurchaseOrderItem> = {}
    matchingResult.items.forEach((item) => {
      if (item.purchaseOrderItem) {
        initialEditedItems[item.id] = { ...item.purchaseOrderItem }
      }
    })
    setEditedItems(initialEditedItems)
  })

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

  // 発注明細の更新
  const handleItemChange = (itemId: string, field: keyof PurchaseOrderItem, value: string | number) => {
    setHasChanges(true)

    const updatedItem = { ...editedItems[itemId] }

    // 数値フィールドの場合は数値に変換
    if (field === "quantity" || field === "unitPrice") {
      updatedItem[field] = typeof value === "string" ? Number.parseFloat(value) : value

      // 金額を再計算
      updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
    } else {
      updatedItem[field] = value
    }

    setEditedItems({
      ...editedItems,
      [itemId]: updatedItem,
    })
  }

  // 変更を保存
  const handleSave = () => {
    // 実際のアプリケーションではAPIを呼び出して保存処理

    // 合計金額を再計算
    let totalAmount = 0
    const updatedItems = matchingResult.items.map((item) => {
      if (item.purchaseOrderItem && editedItems[item.id]) {
        totalAmount += editedItems[item.id].amount
        return {
          ...item,
          purchaseOrderItem: editedItems[item.id],
          // 差異を再計算
          differences: {
            itemCode: item.invoiceItem?.itemCode !== editedItems[item.id].itemCode,
            itemName: item.invoiceItem?.itemName !== editedItems[item.id].itemName,
            quantity: item.invoiceItem?.quantity !== editedItems[item.id].quantity,
            unitPrice: item.invoiceItem?.unitPrice !== editedItems[item.id].unitPrice,
            amount: item.invoiceItem?.amount !== editedItems[item.id].amount,
          },
          // ステータスを再計算
          status: calculateItemStatus(editedItems[item.id], item.invoiceItem),
        }
      }
      return item
    })

    // マッチング結果を更新
    const updatedResult: MatchingResult = {
      ...matchingResult,
      poAmount: totalAmount,
      amountDifference: totalAmount - matchingResult.invoiceAmount,
      processingStatus: "modified",
      items: updatedItems,
      // マッチング率を再計算
      matchRate: calculateMatchRate(updatedItems),
      // 全体的なステータスを再計算
      status: calculateOverallStatus(updatedItems, totalAmount, matchingResult.invoiceAmount),
    }

    setMatchingResult(updatedResult)
    setShowSaveDialog(false)

    alert("変更を保存しました")
    router.push(`/invoice-matching/detail/${matchingResult.id}`)
  }

  // アイテムのステータスを計算
  const calculateItemStatus = (
    poItem: PurchaseOrderItem,
    invItem?: InvoiceItem,
  ): "matched" | "partial_match" | "mismatch" | "po_only" | "invoice_only" => {
    if (!invItem) return "po_only"

    const itemCodeMatch = poItem.itemCode === invItem.itemCode
    const itemNameMatch = poItem.itemName === invItem.itemName
    const quantityMatch = poItem.quantity === invItem.quantity
    const unitPriceMatch = poItem.unitPrice === invItem.unitPrice
    const amountMatch = poItem.amount === invItem.amount

    if (itemCodeMatch && itemNameMatch && quantityMatch && unitPriceMatch && amountMatch) {
      return "matched"
    } else if (itemCodeMatch && (itemNameMatch || quantityMatch || unitPriceMatch || amountMatch)) {
      return "partial_match"
    } else {
      return "mismatch"
    }
  }

  // マッチング率を計算
  const calculateMatchRate = (items: MatchingResultItem[]): number => {
    const totalItems = items.length
    const matchedItems = items.filter((item) => item.status === "matched").length
    const partialMatchItems = items.filter((item) => item.status === "partial_match").length

    return Math.round(((matchedItems + partialMatchItems * 0.5) / totalItems) * 100)
  }

  // 全体的なステータスを計算
  const calculateOverallStatus = (
    items: MatchingResultItem[],
    poAmount: number,
    invAmount: number,
  ): "matched" | "partial_match" | "mismatch" => {
    const allMatched = items.every((item) => item.status === "matched")
    const anyMismatch = items.some(
      (item) => item.status === "mismatch" || item.status === "po_only" || item.status === "invoice_only",
    )
    const amountMatch = Math.abs(poAmount - invAmount) < 0.01

    if (allMatched && amountMatch) {
      return "matched"
    } else if (anyMismatch || Math.abs(poAmount - invAmount) > 1000) {
      return "mismatch"
    } else {
      return "partial_match"
    }
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href={`/invoice-matching/detail/${matchingResult.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              詳細に戻る
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">発注データ修正</h1>
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

        {/* 編集ガイド */}
        <Alert className="mt-6 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700">発注データ修正</AlertTitle>
          <AlertDescription className="text-blue-600">
            請求書データに合わせて発注データを修正してください。修正後、保存ボタンをクリックすると変更が適用されます。
          </AlertDescription>
        </Alert>

        {/* 明細編集テーブル */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">発注明細の修正</CardTitle>
            <CardDescription>請求書データと一致するように発注明細を修正してください</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <TableHead>請求書データ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchingResult.items.map((item) => (
                    <TableRow
                      key={item.id}
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
                        {item.purchaseOrderItem && (
                          <Input
                            value={editedItems[item.id]?.itemCode || ""}
                            onChange={(e) => handleItemChange(item.id, "itemCode", e.target.value)}
                            className={cn("h-8", item.differences.itemCode ? "border-yellow-500" : "")}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.purchaseOrderItem && (
                          <Input
                            value={editedItems[item.id]?.itemName || ""}
                            onChange={(e) => handleItemChange(item.id, "itemName", e.target.value)}
                            className={cn("h-8", item.differences.itemName ? "border-yellow-500" : "")}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.purchaseOrderItem && (
                          <Input
                            type="number"
                            value={editedItems[item.id]?.quantity || 0}
                            onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                            className={cn("h-8 text-right", item.differences.quantity ? "border-yellow-500" : "")}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.purchaseOrderItem && (
                          <Input
                            type="number"
                            value={editedItems[item.id]?.unitPrice || 0}
                            onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                            className={cn("h-8 text-right", item.differences.unitPrice ? "border-yellow-500" : "")}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.purchaseOrderItem && (
                          <Input
                            value={editedItems[item.id]?.amount.toLocaleString() || "0"}
                            readOnly
                            className={cn(
                              "h-8 text-right bg-muted",
                              item.differences.amount ? "border-yellow-500" : "",
                            )}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.invoiceItem ? (
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-muted-foreground">品目: </span>
                              <span>
                                {item.invoiceItem.itemCode} - {item.invoiceItem.itemName}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">数量: </span>
                              <span>{item.invoiceItem.quantity}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">単価: </span>
                              <span>{item.invoiceItem.unitPrice.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">金額: </span>
                              <span>{item.invoiceItem.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">請求書に対応する明細がありません</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
            <Button variant="outline" asChild>
              <Link href={`/invoice-matching/detail/${matchingResult.id}`}>
                <X className="mr-2 h-4 w-4" />
                キャンセル
              </Link>
            </Button>
            <Button onClick={() => setShowSaveDialog(true)} disabled={!hasChanges}>
              <Save className="mr-2 h-4 w-4" />
              変更を保存
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 保存確認ダイアログ */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>変更の保存</DialogTitle>
            <DialogDescription>発注データの変更を保存しますか？この操作は元に戻せません。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-2">変更概要</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">発注番号: </span>
                  <span>{matchingResult.purchaseOrderNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">請求書番号: </span>
                  <span>{matchingResult.invoiceNumber}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存する</Button>
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
