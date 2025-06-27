"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar, Plus, Eye } from "lucide-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useRouter } from "next/navigation"

// モックデータ: 部門
const departmentData = [
  { id: "D001", name: "購買部" },
  { id: "D002", name: "製造部" },
  { id: "D003", name: "営業部" },
  { id: "D004", name: "物流部" },
  { id: "D005", name: "総務部" },
]

// モックデータ: 担当者
const employeeData = [
  { id: "E001", name: "山田太郎", departmentId: "D001" },
  { id: "E002", name: "佐藤花子", departmentId: "D001" },
  { id: "E003", name: "鈴木一郎", departmentId: "D002" },
  { id: "E004", name: "田中美咲", departmentId: "D003" },
  { id: "E005", name: "伊藤健太", departmentId: "D004" },
]

// モックデータ: 倉庫
const warehouseData = [
  { id: "WH001", name: "東京倉庫" },
  { id: "WH002", name: "大阪倉庫" },
  { id: "WH003", name: "名古屋倉庫" },
  { id: "WH004", name: "福岡倉庫" },
  { id: "WH005", name: "札幌倉庫" },
]

// モックデータ: 取引先
const vendorData = [
  { id: "V001", name: "株式会社山田製作所" },
  { id: "V002", name: "東京電子工業株式会社" },
  { id: "V003", name: "大阪金属工業株式会社" },
  { id: "V004", name: "名古屋機械工業株式会社" },
]

// モックデータ: 商品
const productData = [
  { id: "P001", name: "ノートパソコン 15インチ", category: "電子機器", unitPrice: 85000 },
  { id: "P002", name: "デスクトップPC", category: "電子機器", unitPrice: 95000 },
  { id: "P003", name: "モニター 24インチ", category: "電子機器", unitPrice: 25000 },
  { id: "P004", name: "キーボード", category: "周辺機器", unitPrice: 3500 },
  { id: "P005", name: "マウス", category: "周辺機器", unitPrice: 2000 },
  { id: "P006", name: "プリンター", category: "周辺機器", unitPrice: 35000 },
  { id: "P007", name: "USBケーブル", category: "ケーブル", unitPrice: 800 },
  { id: "P008", name: "HDMIケーブル", category: "ケーブル", unitPrice: 1200 },
  { id: "P009", name: "LANケーブル", category: "ケーブル", unitPrice: 1500 },
  { id: "P010", name: "スマートフォン", category: "電子機器", unitPrice: 65000 },
]

// モックデータ: 発注点発注実行履歴
const generateBatchHistoryData = () => {
  const statuses = ["成功", "一部成功", "失敗"]
  const histories = []

  for (let i = 1; i <= 10; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const employee = employeeData[Math.floor(Math.random() * employeeData.length)]

    histories.push({
      id: `BH${String(i).padStart(3, "0")}`,
      executionDate: date,
      executorId: employee.id,
      executorName: employee.name,
      status,
      itemCount: Math.floor(Math.random() * 20) + 1,
      totalAmount: Math.floor(Math.random() * 10000000) + 100000,
    })
  }

  return histories
}

// モックデータ: 仮発注データ
const generateTempOrderData = (historyId) => {
  const orders = []
  const itemCount = Math.floor(Math.random() * 15) + 5

  for (let i = 1; i <= itemCount; i++) {
    const product = productData[Math.floor(Math.random() * productData.length)]
    const vendor = vendorData[Math.floor(Math.random() * vendorData.length)]
    const department = departmentData[Math.floor(Math.random() * departmentData.length)]
    const employee = employeeData.filter((e) => e.departmentId === department.id)[0] || employeeData[0]
    const quantity = Math.floor(Math.random() * 10) + 1
    const amount = product.unitPrice * quantity

    const date = new Date()
    date.setDate(date.getDate() + Math.floor(Math.random() * 14))

    orders.push({
      id: `TO${historyId.substring(2)}${String(i).padStart(3, "0")}`,
      historyId,
      orderDate: date,
      departmentId: department.id,
      departmentName: department.name,
      employeeId: employee.id,
      employeeName: employee.name,
      vendorId: vendor.id,
      vendorName: vendor.name,
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.unitPrice,
      amount,
      status: Math.random() > 0.3 ? "未処理" : "処理済",
    })
  }

  return orders
}

export default function AutoOrderHistoryPage() {
  const router = useRouter()
  const [batchHistories, setBatchHistories] = useState([])
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [tempOrders, setTempOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [showNewBatchDialog, setShowNewBatchDialog] = useState(false)

  // 新規バッチ設定用の状態
  const [newBatchSettings, setNewBatchSettings] = useState({
    departmentId: "",
    employeeId: "",
    warehouseId: "",
    executionDate: new Date(),
    threshold: 80, // デフォルト: 発注点の80%以下で発注
  })

  // 初期データ読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      // 実際のアプリケーションではAPIからデータを取得
      setTimeout(() => {
        const histories = generateBatchHistoryData()
        setBatchHistories(histories)
        setIsLoading(false)
      }, 1000)
    }

    loadData()
  }, [])

  // 履歴詳細の読み込み
  const loadHistoryDetail = (historyId) => {
    setIsDetailLoading(true)
    setSelectedHistory(historyId)
    setSelectedOrders([])

    // 実際のアプリケーションではAPIからデータを取得
    setTimeout(() => {
      const orders = generateTempOrderData(historyId)
      setTempOrders(orders)
      setIsDetailLoading(false)
    }, 800)
  }

  // 発注処理の実行
  const processOrder = (orderId) => {
    // 実際のアプリケーションではAPIを呼び出して発注処理を実行
    setTempOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "処理済" } : order)))
  }

  // 一括発注処理の実行
  const processBulkOrders = () => {
    if (selectedOrders.length === 0) return

    // 実際のアプリケーションではAPIを呼び出して一括発注処理を実行
    setTempOrders((prev) =>
      prev.map((order) => (selectedOrders.includes(order.id) ? { ...order, status: "処理済" } : order)),
    )

    setSelectedOrders([])
  }

  // 新規バッチ処理の実行
  const executeNewBatch = () => {
    // 実際のアプリケーションではAPIを呼び出して新規バッチ処理を実行
    setShowNewBatchDialog(false)
    setIsLoading(true)

    setTimeout(() => {
      const newHistory = {
        id: `BH${String(batchHistories.length + 1).padStart(3, "0")}`,
        executionDate: new Date(),
        executorId: newBatchSettings.employeeId || "E001",
        executorName: employeeData.find((e) => e.id === (newBatchSettings.employeeId || "E001"))?.name || "山田太郎",
        status: "成功",
        itemCount: Math.floor(Math.random() * 20) + 1,
        totalAmount: Math.floor(Math.random() * 10000000) + 100000,
      }

      setBatchHistories((prev) => [newHistory, ...prev])
      setIsLoading(false)

      // 新しく作成した履歴の詳細を表示
      loadHistoryDetail(newHistory.id)
    }, 1500)
  }

  // 選択状態の切り替え
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId)
      } else {
        return [...prev, orderId]
      }
    })
  }

  // 全選択/全解除の切り替え
  const toggleSelectAll = (checked) => {
    if (checked) {
      const unprocessedOrders = tempOrders.filter((order) => order.status === "未処理").map((order) => order.id)
      setSelectedOrders(unprocessedOrders)
    } else {
      setSelectedOrders([])
    }
  }

  // 発注点発注画面に遷移
  const navigateToAutoOrder = (historyId) => {
    router.push(`/reorder-point/auto-order?historyId=${historyId}`)
  }

  // 処理可能な注文の数
  const processableOrdersCount = tempOrders.filter((order) => order.status === "未処理").length

  // 選択中の注文の合計金額
  const selectedOrdersAmount = tempOrders
    .filter((order) => selectedOrders.includes(order.id))
    .reduce((sum, order) => sum + order.amount, 0)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">発注点発注履歴</h1>
        <Button onClick={() => setShowNewBatchDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規バッチ処理
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>発注点発注実行履歴</CardTitle>
          <CardDescription>
            過去に実行された発注点発注処理の履歴一覧です。詳細を表示するには履歴をクリックしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">データを読み込んでいます...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>実行履歴番号</TableHead>
                    <TableHead>実行日時</TableHead>
                    <TableHead>実行者</TableHead>
                    <TableHead>処理結果</TableHead>
                    <TableHead>処理件数</TableHead>
                    <TableHead className="text-right">合計金額</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchHistories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        実行履歴がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchHistories.map((history) => (
                      <TableRow key={history.id} className={selectedHistory === history.id ? "bg-muted" : ""}>
                        <TableCell className="font-medium">{history.id}</TableCell>
                        <TableCell>{format(history.executionDate, "yyyy/MM/dd HH:mm", { locale: ja })}</TableCell>
                        <TableCell>{history.executorName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              history.status === "成功"
                                ? "success"
                                : history.status === "一部成功"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {history.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{history.itemCount}件</TableCell>
                        <TableCell className="text-right">{history.totalAmount.toLocaleString()}円</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigateToAutoOrder(history.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新規バッチ処理ダイアログ */}
      <Dialog open={showNewBatchDialog} onOpenChange={setShowNewBatchDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>新規発注点発注バッチ処理</DialogTitle>
            <DialogDescription>
              発注点発注の新規バッチ処理を設定します。必要な情報を入力して実行してください。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">発注部門</Label>
                <Select
                  value={newBatchSettings.departmentId}
                  onValueChange={(value) => setNewBatchSettings({ ...newBatchSettings, departmentId: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentData.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee">発注担当者</Label>
                <Select
                  value={newBatchSettings.employeeId}
                  onValueChange={(value) => setNewBatchSettings({ ...newBatchSettings, employeeId: value })}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="担当者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeData
                      .filter(
                        (emp) => !newBatchSettings.departmentId || emp.departmentId === newBatchSettings.departmentId,
                      )
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">対象倉庫</Label>
                <Select
                  value={newBatchSettings.warehouseId}
                  onValueChange={(value) => setNewBatchSettings({ ...newBatchSettings, warehouseId: value })}
                >
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder="倉庫を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseData.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="execution-date">実行日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {newBatchSettings.executionDate ? (
                        format(newBatchSettings.executionDate, "yyyy年MM月dd日", { locale: ja })
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newBatchSettings.executionDate}
                      onSelect={(date) => setNewBatchSettings({ ...newBatchSettings, executionDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">発注点閾値 (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={newBatchSettings.threshold}
                  onChange={(e) =>
                    setNewBatchSettings({
                      ...newBatchSettings,
                      threshold: Number.parseInt(e.target.value) || 80,
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">発注点の{newBatchSettings.threshold}%以下で発注</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>追加設定</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-vendor" />
                  <label
                    htmlFor="auto-vendor"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    優先取引先を自動設定する
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-process" />
                  <label
                    htmlFor="auto-process"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    発注処理を自動実行する
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBatchDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={executeNewBatch}>
              <Play className="mr-2 h-4 w-4" />
              バッチ処理実行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Playアイコンの定義
function Play(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
