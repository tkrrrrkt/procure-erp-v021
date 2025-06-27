"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, CheckCircle, Clock, Search, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// 見積依頼データの型定義
interface QuotationRequest {
  id: string
  requestNo: string
  requestDate: Date
  dueDate: Date
  status: "未回答" | "回答済"
  items: QuotationItem[]
}

interface QuotationItem {
  id: string
  itemCode: string
  itemName: string
  specification: string
  quantity: number
  unit: string
  requestedDeliveryDate: Date | null
  unitPrice: number | null
  amount: number | null
  responseDeliveryDate: Date | null
}

export default function SupplierQuotationResponses() {
  // 状態管理
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [editedItems, setEditedItems] = useState<Record<string, QuotationItem>>({})

  // 見積依頼データの取得（モックデータ）
  useEffect(() => {
    // 実際の実装ではAPIからデータを取得
    const mockData: QuotationRequest[] = [
      {
        id: "QR001",
        requestNo: "RFQ-2023-0001",
        requestDate: new Date(2023, 2, 15),
        dueDate: new Date(2023, 2, 25),
        status: "未回答",
        items: [
          {
            id: "QRI001",
            itemCode: "PART-A001",
            itemName: "高性能モーター",
            specification: "200V 3相 1.5kW",
            quantity: 10,
            unit: "個",
            requestedDeliveryDate: new Date(2023, 3, 15),
            unitPrice: null,
            amount: null,
            responseDeliveryDate: null,
          },
          {
            id: "QRI002",
            itemCode: "PART-B002",
            itemName: "制御基板",
            specification: "Ver.2.0 標準タイプ",
            quantity: 20,
            unit: "枚",
            requestedDeliveryDate: new Date(2023, 3, 20),
            unitPrice: null,
            amount: null,
            responseDeliveryDate: null,
          },
        ],
      },
      {
        id: "QR002",
        requestNo: "RFQ-2023-0002",
        requestDate: new Date(2023, 2, 18),
        dueDate: new Date(2023, 2, 28),
        status: "未回答",
        items: [
          {
            id: "QRI003",
            itemCode: "PART-C003",
            itemName: "センサーユニット",
            specification: "高精度タイプ IP67",
            quantity: 5,
            unit: "個",
            requestedDeliveryDate: new Date(2023, 4, 5),
            unitPrice: null,
            amount: null,
            responseDeliveryDate: null,
          },
        ],
      },
      {
        id: "QR003",
        requestNo: "RFQ-2023-0003",
        requestDate: new Date(2023, 2, 20),
        dueDate: new Date(2023, 3, 5),
        status: "回答済",
        items: [
          {
            id: "QRI004",
            itemCode: "PART-D004",
            itemName: "電源ユニット",
            specification: "AC100V-240V 50/60Hz",
            quantity: 15,
            unit: "個",
            requestedDeliveryDate: new Date(2023, 4, 10),
            unitPrice: 12500,
            amount: 187500,
            responseDeliveryDate: new Date(2023, 4, 8),
          },
          {
            id: "QRI005",
            itemCode: "PART-E005",
            itemName: "ケーブル",
            specification: "5m シールド付",
            quantity: 30,
            unit: "本",
            requestedDeliveryDate: new Date(2023, 4, 10),
            unitPrice: 2800,
            amount: 84000,
            responseDeliveryDate: new Date(2023, 4, 7),
          },
        ],
      },
    ]

    setQuotationRequests(mockData)
  }, [])

  // 検索フィルター
  const filteredRequests = quotationRequests.filter(
    (request) =>
      request.requestNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some(
        (item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  // 見積依頼の選択
  const handleSelectRequest = (request: QuotationRequest) => {
    setSelectedRequest(request)

    // 編集用のアイテムを初期化
    const initialEditedItems: Record<string, QuotationItem> = {}
    request.items.forEach((item) => {
      initialEditedItems[item.id] = { ...item }
    })
    setEditedItems(initialEditedItems)
  }

  // 単価の更新
  const handleUnitPriceChange = (itemId: string, value: string) => {
    const numValue = value === "" ? null : Number.parseFloat(value)

    setEditedItems((prev) => {
      const updatedItem = { ...prev[itemId], unitPrice: numValue }

      // 金額の自動計算
      if (numValue !== null) {
        updatedItem.amount = numValue * updatedItem.quantity
      } else {
        updatedItem.amount = null
      }

      return { ...prev, [itemId]: updatedItem }
    })
  }

  // 納期の更新
  const handleDeliveryDateChange = (itemId: string, date: Date | null) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], responseDeliveryDate: date },
    }))
  }

  // 見積回答の送信
  const handleSubmitResponse = () => {
    // バリデーション
    const hasEmptyFields = Object.values(editedItems).some(
      (item) => item.unitPrice === null || item.responseDeliveryDate === null,
    )

    if (hasEmptyFields) {
      alert("すべての項目に単価と納期を入力してください。")
      return
    }

    // 実際の実装ではAPIにデータを送信
    if (selectedRequest) {
      // 更新されたデータで状態を更新
      setQuotationRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status: "回答済",
                items: req.items.map((item) => ({
                  ...item,
                  unitPrice: editedItems[item.id].unitPrice,
                  amount: editedItems[item.id].amount,
                  responseDeliveryDate: editedItems[item.id].responseDeliveryDate,
                })),
              }
            : req,
        ),
      )

      setShowSuccessDialog(true)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Web見積回答入力</h1>
        <p className="text-muted-foreground">見積依頼に対して納期・単価・金額を入力し回答します</p>
      </div>

      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="見積番号、品名、品番で検索..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* 見積依頼一覧 */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <CardTitle>見積依頼一覧</CardTitle>
            <CardDescription className="text-blue-100">回答が必要な見積依頼</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead>見積番号</TableHead>
                    <TableHead>依頼日</TableHead>
                    <TableHead>回答期限</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className={cn("hover:bg-muted/50", selectedRequest?.id === request.id && "bg-muted")}
                      >
                        <TableCell className="font-medium">{request.requestNo}</TableCell>
                        <TableCell>{format(request.requestDate, "yyyy/MM/dd")}</TableCell>
                        <TableCell>{format(request.dueDate, "yyyy/MM/dd")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={request.status === "未回答" ? "outline" : "default"}
                            className={cn(
                              request.status === "未回答"
                                ? "border-amber-500 text-amber-500"
                                : "bg-green-600 hover:bg-green-700",
                            )}
                          >
                            {request.status === "未回答" ? (
                              <Clock className="mr-1 h-3 w-3" />
                            ) : (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            )}
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectRequest(request)}
                            className={selectedRequest?.id === request.id ? "bg-blue-100" : ""}
                          >
                            選択
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        見積依頼が見つかりません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 見積回答入力フォーム */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <CardTitle>見積回答入力</CardTitle>
            <CardDescription className="text-blue-100">納期と単価を入力して回答してください</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {selectedRequest ? (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1">見積番号</p>
                    <p className="text-lg font-bold">{selectedRequest.requestNo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">依頼日</p>
                    <p className="text-lg font-bold">{format(selectedRequest.requestDate, "yyyy年MM月dd日")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">回答期限</p>
                    <p className={cn("text-lg font-bold", new Date() > selectedRequest.dueDate ? "text-red-600" : "")}>
                      {format(selectedRequest.dueDate, "yyyy年MM月dd日")}
                    </p>
                  </div>
                </div>

                {selectedRequest.status === "回答済" && (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      この見積依頼は回答済みです。内容を確認できます。
                    </AlertDescription>
                  </Alert>
                )}

                <div className="rounded-md border overflow-hidden mb-6">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
                      <TableRow>
                        <TableHead className="w-[100px]">品番</TableHead>
                        <TableHead>品名・仕様</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">単位</TableHead>
                        <TableHead>希望納期</TableHead>
                        <TableHead>回答納期</TableHead>
                        <TableHead className="text-right">単価</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items.map((item) => {
                        const editedItem = editedItems[item.id]
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.itemCode}</TableCell>
                            <TableCell>
                              <div>{item.itemName}</div>
                              <div className="text-sm text-muted-foreground">{item.specification}</div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.unit}</TableCell>
                            <TableCell>
                              {item.requestedDeliveryDate
                                ? format(item.requestedDeliveryDate, "yyyy/MM/dd")
                                : "指定なし"}
                            </TableCell>
                            <TableCell>
                              {selectedRequest.status === "回答済" ? (
                                editedItem.responseDeliveryDate ? (
                                  format(editedItem.responseDeliveryDate, "yyyy/MM/dd")
                                ) : (
                                  "-"
                                )
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !editedItem.responseDeliveryDate && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {editedItem.responseDeliveryDate ? (
                                        format(editedItem.responseDeliveryDate, "yyyy/MM/dd")
                                      ) : (
                                        <span>納期を選択</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={editedItem.responseDeliveryDate || undefined}
                                      onSelect={(date) => handleDeliveryDateChange(item.id, date)}
                                      initialFocus
                                      locale={ja}
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            </TableCell>
                            <TableCell>
                              {selectedRequest.status === "回答済" ? (
                                <div className="text-right">{editedItem.unitPrice?.toLocaleString() || "-"}</div>
                              ) : (
                                <Input
                                  type="number"
                                  value={editedItem.unitPrice === null ? "" : editedItem.unitPrice}
                                  onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                                  className="text-right"
                                  placeholder="単価を入力"
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {editedItem.amount === null ? "-" : editedItem.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {selectedRequest.status === "未回答" && (
                  <div className="flex justify-end">
                    <Button onClick={handleSubmitResponse} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="mr-2 h-4 w-4" />
                      見積回答を送信する
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">上のリストから見積依頼を選択してください</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 成功ダイアログ */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>見積回答を送信しました</DialogTitle>
            <DialogDescription>
              見積回答が正常に送信されました。バイヤー企業での確認をお待ちください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
