"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Check, Loader2, ShoppingCart, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { useRouter, useSearchParams } from "next/navigation"

// 倉庫データのモック
const warehouseData = [
  { id: "WH001", name: "東京倉庫" },
  { id: "WH002", name: "大阪倉庫" },
  { id: "WH003", name: "名古屋倉庫" },
  { id: "WH004", name: "福岡倉庫" },
  { id: "WH005", name: "札幌倉庫" },
]

// 取引先データのモック
const vendorData = [
  { id: "V001", name: "株式会社山田製作所", preferredItems: ["P001", "P002", "P003"] },
  { id: "V002", name: "東京電子工業株式会社", preferredItems: ["P003", "P004", "P010"] },
  { id: "V003", name: "大阪金属工業株式会社", preferredItems: ["P005", "P006"] },
  { id: "V004", name: "名古屋機械工業株式会社", preferredItems: ["P007", "P008", "P009"] },
]

// 商品データのモック
const productData = [
  {
    id: "P001",
    name: "ノートパソコン 15インチ",
    category: "電子機器",
    unitPrice: 85000,
    leadTime: 7,
    preferredVendor: "V001",
  },
  { id: "P002", name: "デスクトップPC", category: "電子機器", unitPrice: 95000, leadTime: 10, preferredVendor: "V001" },
  {
    id: "P003",
    name: "モニター 24インチ",
    category: "電子機器",
    unitPrice: 25000,
    leadTime: 5,
    preferredVendor: "V002",
  },
  { id: "P004", name: "キーボード", category: "周辺機器", unitPrice: 3500, leadTime: 3, preferredVendor: "V002" },
  { id: "P005", name: "マウス", category: "周辺機器", unitPrice: 2000, leadTime: 3, preferredVendor: "V003" },
  { id: "P006", name: "プリンター", category: "周辺機器", unitPrice: 35000, leadTime: 7, preferredVendor: "V003" },
  { id: "P007", name: "USBケーブル", category: "ケーブル", unitPrice: 800, leadTime: 2, preferredVendor: "V004" },
  { id: "P008", name: "HDMIケーブル", category: "ケーブル", unitPrice: 1200, leadTime: 2, preferredVendor: "V004" },
  { id: "P009", name: "LANケーブル", category: "ケーブル", unitPrice: 1500, leadTime: 2, preferredVendor: "V004" },
  { id: "P010", name: "スマートフォン", category: "電子機器", unitPrice: 65000, leadTime: 5, preferredVendor: "V002" },
]

// 発注点データのモック生成関数
const generateReorderPointItems = () => {
  // 発注点を下回っている商品をランダムに生成
  const items = []
  const productCount = Math.floor(Math.random() * 5) + 3 // 3〜7個の商品
  const selectedProducts = [...productData].sort(() => 0.5 - Math.random()).slice(0, productCount)

  for (const product of selectedProducts) {
    const reorderPoint = Math.floor(Math.random() * 20) + 10
    const safetyStock = Math.floor(reorderPoint * 0.5)
    const currentStock = Math.floor(Math.random() * safetyStock) // 安全在庫以下の在庫数
    const suggestedOrderQty = reorderPoint - currentStock + safetyStock // 発注点 - 現在庫 + 安全在庫

    items.push({
      id: `item-${product.id}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock,
      reorderPoint,
      safetyStock,
      suggestedOrderQty,
      orderQty: suggestedOrderQty,
      unitPrice: product.unitPrice,
      amount: product.unitPrice * suggestedOrderQty,
      leadTime: product.leadTime,
      preferredVendor: product.preferredVendor,
      selected: true,
    })
  }

  return items
}

// 発注データのグループ化（取引先ごと）
const groupItemsByVendor = (items) => {
  const groupedItems = {}

  for (const item of items) {
    if (item.selected) {
      const vendorId = item.preferredVendor
      if (!groupedItems[vendorId]) {
        const vendor = vendorData.find((v) => v.id === vendorId)
        groupedItems[vendorId] = {
          vendorId,
          vendorName: vendor ? vendor.name : "不明",
          items: [],
          totalAmount: 0,
        }
      }

      groupedItems[vendorId].items.push(item)
      groupedItems[vendorId].totalAmount += item.amount
    }
  }

  return Object.values(groupedItems)
}

// 履歴データのモック
const getBatchHistoryById = (historyId) => {
  // 実際のアプリケーションではAPIからデータを取得
  const date = new Date()
  date.setDate(date.getDate() - Number.parseInt(historyId.substring(2)))

  return {
    id: historyId,
    executionDate: date,
    executorId: "E001",
    executorName: "山田太郎",
    status: "成功",
    warehouseId: "WH001",
    warehouseName: "東京倉庫",
    itemCount: Math.floor(Math.random() * 20) + 1,
    totalAmount: Math.floor(Math.random() * 10000000) + 100000,
  }
}

export default function AutoOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const historyId = searchParams.get("historyId")

  const [reorderItems, setReorderItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState("WH001") // デフォルト倉庫
  const [selectedTab, setSelectedTab] = useState("items")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [generatedOrders, setGeneratedOrders] = useState([])
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false)
  const [isOrdersGenerated, setIsOrdersGenerated] = useState(false)
  const [orderDate] = useState(new Date())
  const [deliveryDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) // 2週間後
  const [batchHistory, setBatchHistory] = useState(null)

  // 初期データ読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      // 履歴IDがある場合は履歴データを取得
      if (historyId) {
        const history = getBatchHistoryById(historyId)
        setBatchHistory(history)
        setSelectedWarehouse(history.warehouseId)
      }

      // 実際のアプリケーションではAPIからデータを取得
      setTimeout(() => {
        const items = generateReorderPointItems()
        setReorderItems(items)
        setIsLoading(false)
      }, 1000)
    }

    loadData()
  }, [historyId])

  // 全選択/全解除の切り替え
  const toggleSelectAll = (checked) => {
    setReorderItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: checked,
      })),
    )
  }

  // 個別選択の切り替え
  const toggleSelectItem = (id, checked) => {
    setReorderItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: checked } : item)))
  }

  // 発注数量の変更
  const handleOrderQtyChange = (id, value) => {
    const qty = Number.parseInt(value, 10) || 0

    setReorderItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            orderQty: qty,
            amount: qty * item.unitPrice,
          }
        }
        return item
      }),
    )
  }

  // 優先取引先の変更
  const handleVendorChange = (id, vendorId) => {
    setReorderItems((prev) => prev.map((item) => (item.id === id ? { ...item, preferredVendor: vendorId } : item)))
  }

  // 発注データ作成
  const generateOrders = () => {
    setIsGeneratingOrders(true)

    // 実際のアプリケーションではAPIを呼び出して発注データを作成
    setTimeout(() => {
      const groupedOrders = groupItemsByVendor(reorderItems)
      setGeneratedOrders(groupedOrders)
      setIsGeneratingOrders(false)
      setIsOrdersGenerated(true)
      setSelectedTab("orders")
    }, 1500)
  }

  // 発注確定
  const confirmOrders = () => {
    setShowConfirmDialog(false)

    // 実際のアプリケーションではAPIを呼び出して発注を確定
    alert("発注が確定されました。発注書が作成されます。")

    // 発注後は新しいデータを読み込む
    setIsLoading(true)
    setIsOrdersGenerated(false)
    setSelectedTab("items")

    setTimeout(() => {
      const items = generateReorderPointItems()
      setReorderItems(items)
      setIsLoading(false)
    }, 1000)
  }

  // 履歴一覧に戻る
  const goBackToHistory = () => {
    router.push("/reorder-point/auto-order/history")
  }

  // 選択されている商品の数
  const selectedItemsCount = reorderItems.filter((item) => item.selected).length

  // 選択されている商品の合計金額
  const totalAmount = reorderItems.filter((item) => item.selected).reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBackToHistory}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            履歴一覧に戻る
          </Button>
          <h1 className="text-3xl font-bold">発注点発注</h1>
          {batchHistory && (
            <Badge variant="outline" className="text-base font-normal">
              実行履歴番号: {batchHistory.id}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="warehouse">倉庫:</Label>
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger id="warehouse" className="w-[180px]">
              <SelectValue placeholder="倉庫を選択" />
            </SelectTrigger>
            <SelectContent>
              {warehouseData.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {batchHistory && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">実行日時</p>
                <p>{format(batchHistory.executionDate, "yyyy/MM/dd HH:mm", { locale: ja })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">実行者</p>
                <p>{batchHistory.executorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">対象倉庫</p>
                <p>{batchHistory.warehouseName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">処理結果</p>
                <Badge
                  variant={
                    batchHistory.status === "成功"
                      ? "success"
                      : batchHistory.status === "一部成功"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {batchHistory.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>発注点を下回っている商品があります</AlertTitle>
        <AlertDescription>
          以下の商品は在庫数が発注点を下回っています。発注が必要な商品を選択して発注データを作成してください。
        </AlertDescription>
      </Alert>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="items">発注候補商品</TabsTrigger>
          <TabsTrigger value="orders" disabled={!isOrdersGenerated}>
            作成された発注
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>発注点を下回っている商品</CardTitle>
              <CardDescription>
                {selectedWarehouse && warehouseData.find((w) => w.id === selectedWarehouse)?.name}の発注候補商品一覧
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">データを読み込んでいます...</span>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={reorderItems.length > 0 && reorderItems.every((item) => item.selected)}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>商品コード</TableHead>
                          <TableHead>商品名</TableHead>
                          <TableHead>カテゴリ</TableHead>
                          <TableHead className="text-right">現在庫</TableHead>
                          <TableHead className="text-right">発注点</TableHead>
                          <TableHead className="text-right">安全在庫</TableHead>
                          <TableHead className="text-right">発注数量</TableHead>
                          <TableHead className="text-right">単価</TableHead>
                          <TableHead className="text-right">金額</TableHead>
                          <TableHead>優先取引先</TableHead>
                          <TableHead className="text-right">リードタイム</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reorderItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="h-24 text-center">
                              発注点を下回っている商品はありません
                            </TableCell>
                          </TableRow>
                        ) : (
                          reorderItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={(checked) => toggleSelectItem(item.id, checked)}
                                />
                              </TableCell>
                              <TableCell>{item.productId}</TableCell>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right">
                                {item.currentStock}
                                <Badge variant="destructive" className="ml-2">
                                  発注点以下
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{item.reorderPoint}</TableCell>
                              <TableCell className="text-right">{item.safetyStock}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.orderQty}
                                  onChange={(e) => handleOrderQtyChange(item.id, e.target.value)}
                                  className="w-20 text-right"
                                  disabled={!item.selected}
                                />
                              </TableCell>
                              <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Select
                                  value={item.preferredVendor}
                                  onValueChange={(value) => handleVendorChange(item.id, value)}
                                  disabled={!item.selected}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="取引先を選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vendorData.map((vendor) => (
                                      <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">{item.leadTime}日</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        選択中: {selectedItemsCount} 件 / 合計: {totalAmount.toLocaleString()} 円
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button onClick={generateOrders} disabled={isLoading || selectedItemsCount === 0 || isGeneratingOrders}>
                {isGeneratingOrders ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    発注データ作成
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>作成された発注データ</CardTitle>
              <CardDescription>
                取引先ごとに発注データが作成されました。内容を確認して発注を確定してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {generatedOrders.map((order, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{order.vendorName}</h3>
                        <p className="text-sm text-muted-foreground">取引先コード: {order.vendorId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">合計金額: {order.totalAmount.toLocaleString()} 円</p>
                        <p className="text-sm text-muted-foreground">
                          発注日: {format(orderDate, "yyyy年MM月dd日", { locale: ja })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          納期: {format(deliveryDate, "yyyy年MM月dd日", { locale: ja })}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>商品コード</TableHead>
                            <TableHead>商品名</TableHead>
                            <TableHead className="text-right">数量</TableHead>
                            <TableHead className="text-right">単価</TableHead>
                            <TableHead className="text-right">金額</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productId}</TableCell>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.orderQty}</TableCell>
                              <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-medium">
                              合計:
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {order.totalAmount.toLocaleString()} 円
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedTab("items")}>
                戻る
              </Button>
              <Button onClick={() => setShowConfirmDialog(true)}>
                <Check className="mr-2 h-4 w-4" />
                発注を確定する
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>発注の確定</DialogTitle>
            <DialogDescription>
              {generatedOrders.length}件の発注データを確定します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">以下の取引先に発注を行います：</p>
            <ul className="list-disc pl-5 space-y-1">
              {generatedOrders.map((order, index) => (
                <li key={index}>
                  {order.vendorName} - {order.items.length}品目 ({order.totalAmount.toLocaleString()}円)
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={confirmOrders}>
              <Check className="mr-2 h-4 w-4" />
              確定する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
