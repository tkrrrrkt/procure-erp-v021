"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Mail,
  Printer,
  Search,
  Upload,
  FileText,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
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

// 発注データの型定義
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
  status: "draft" | "pending" | "approved" | "rejected" | "completed" | "canceled"
  issueType: "email" | "print" | "upload" | "other"
  issueTypeLabel: string
  totalAmount: number
  currency: string
  orderTitle: string
  issuedAt?: Date
  issuedBy?: string
}

// ステータスに対応するラベルとカラー
const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-200 text-gray-800" },
  pending: { label: "承認待ち", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済", color: "bg-green-100 text-green-800" },
  rejected: { label: "却下", color: "bg-red-100 text-red-800" },
  completed: { label: "完了", color: "bg-blue-100 text-blue-800" },
  canceled: { label: "キャンセル", color: "bg-gray-100 text-gray-800" },
}

// 発行区分に対応するラベルとアイコン
const issueTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  email: {
    label: "メール",
    icon: <Mail className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800",
  },
  print: {
    label: "発注書出力",
    icon: <Printer className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800",
  },
  upload: {
    label: "Upload",
    icon: <Upload className="h-4 w-4" />,
    color: "bg-green-100 text-green-800",
  },
  other: {
    label: "その他",
    icon: <FileText className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-800",
  },
}

// サンプルデータ
const samplePurchaseOrders: PurchaseOrder[] = [
  {
    id: "1",
    orderNumber: "PO-2023-0459",
    orderDate: new Date(2023, 11, 15),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 22),
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "1",
    personInChargeName: "田中 健太",
    status: "approved",
    issueType: "email",
    issueTypeLabel: "メール",
    totalAmount: 16500,
    currency: "JPY",
    orderTitle: "製造部材料発注 12月分",
  },
  {
    id: "2",
    orderNumber: "PO-2023-0458",
    orderDate: new Date(2023, 11, 14),
    vendorId: "3",
    vendorName: "大阪金属工業株式会社",
    orderType: "urgent",
    orderTypeLabel: "緊急発注",
    deliveryDate: new Date(2023, 11, 16),
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "1",
    personInChargeName: "田中 健太",
    status: "approved",
    issueType: "print",
    issueTypeLabel: "発注書出力",
    totalAmount: 45000,
    currency: "JPY",
    orderTitle: "特急部品発注",
  },
  {
    id: "3",
    orderNumber: "PO-2023-0457",
    orderDate: new Date(2023, 11, 13),
    vendorId: "2",
    vendorName: "東京電子工業株式会社",
    orderType: "planned",
    orderTypeLabel: "計画発注",
    deliveryDate: new Date(2023, 11, 28),
    departmentId: "2",
    departmentName: "開発部",
    personInChargeId: "3",
    personInChargeName: "鈴木 大輔",
    status: "approved",
    issueType: "upload",
    issueTypeLabel: "Upload",
    totalAmount: 120000,
    currency: "JPY",
    orderTitle: "開発用電子部品",
  },
  {
    id: "4",
    orderNumber: "PO-2023-0456",
    orderDate: new Date(2023, 11, 10),
    vendorId: "5",
    vendorName: "福岡精密機器株式会社",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 20),
    departmentId: "3",
    departmentName: "営業部",
    personInChargeId: "2",
    personInChargeName: "佐藤 美咲",
    status: "approved",
    issueType: "other",
    issueTypeLabel: "その他",
    totalAmount: 78500,
    currency: "JPY",
    orderTitle: "デモ用サンプル部品",
  },
  {
    id: "5",
    orderNumber: "PO-2023-0455",
    orderDate: new Date(2023, 11, 8),
    vendorId: "4",
    vendorName: "名古屋機械工業株式会社",
    orderType: "blanket",
    orderTypeLabel: "包括発注",
    deliveryDate: new Date(2023, 12, 15),
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "4",
    personInChargeName: "高橋 直子",
    status: "approved",
    issueType: "email",
    issueTypeLabel: "メール",
    totalAmount: 350000,
    currency: "JPY",
    orderTitle: "1月-3月期定期発注",
  },
  {
    id: "6",
    orderNumber: "PO-2023-0454",
    orderDate: new Date(2023, 11, 5),
    vendorId: "6",
    vendorName: "札幌工業株式会社",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 15),
    departmentId: "4",
    departmentName: "総務部",
    personInChargeId: "2",
    personInChargeName: "佐藤 美咲",
    status: "approved",
    issueType: "print",
    issueTypeLabel: "発注書出力",
    totalAmount: 25000,
    currency: "JPY",
    orderTitle: "事務用品発注",
  },
  {
    id: "7",
    orderNumber: "PO-2023-0453",
    orderDate: new Date(2023, 11, 1),
    vendorId: "7",
    vendorName: "仙台金属加工株式会社",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 10),
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "1",
    personInChargeName: "田中 健太",
    status: "approved",
    issueType: "upload",
    issueTypeLabel: "Upload",
    totalAmount: 65000,
    currency: "JPY",
    orderTitle: "試作品用部材",
  },
  {
    id: "8",
    orderNumber: "PO-2023-0452",
    orderDate: new Date(2023, 10, 28),
    vendorId: "8",
    vendorName: "広島製作所",
    orderType: "urgent",
    orderTypeLabel: "緊急発注",
    deliveryDate: new Date(2023, 10, 30),
    departmentId: "2",
    departmentName: "開発部",
    personInChargeId: "3",
    personInChargeName: "鈴木 大輔",
    status: "approved",
    issueType: "other",
    issueTypeLabel: "その他",
    totalAmount: 42000,
    currency: "JPY",
    orderTitle: "試験用部品緊急発注",
  },
]

// 部門データ
const departments = [
  { id: "1", name: "製造部" },
  { id: "2", name: "開発部" },
  { id: "3", name: "営業部" },
  { id: "4", name: "総務部" },
]

export default function PurchaseOrderIssuePage() {
  // 状態管理
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [currentTab, setCurrentTab] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "orderDate",
    direction: "desc",
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [processingType, setProcessingType] = useState<string>("")

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // フィルタリングとソート
  const filteredOrders = samplePurchaseOrders
    .filter((order) => {
      // 承認済みのみ表示
      if (order.status !== "approved") return false

      // タブフィルター
      if (currentTab !== "all" && order.issueType !== currentTab) return false

      // 検索語句でフィルタリング
      const searchMatch =
        searchTerm === "" ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderTitle.toLowerCase().includes(searchTerm.toLowerCase())

      // 部門でフィルタリング
      const departmentMatch = departmentFilter === "all" || order.departmentId === departmentFilter

      // 日付範囲でフィルタリング
      const dateMatch =
        (!dateRange.from || order.orderDate >= dateRange.from) && (!dateRange.to || order.orderDate <= dateRange.to)

      return searchMatch && departmentMatch && dateMatch
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig

      if (key === "orderDate") {
        return direction === "asc"
          ? a.orderDate.getTime() - b.orderDate.getTime()
          : b.orderDate.getTime() - a.orderDate.getTime()
      }

      if (key === "deliveryDate") {
        return direction === "asc"
          ? a.deliveryDate.getTime() - b.deliveryDate.getTime()
          : b.deliveryDate.getTime() - a.deliveryDate.getTime()
      }

      if (key === "totalAmount") {
        return direction === "asc" ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount
      }

      return 0
    })

  // ページネーション処理
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // ソート処理
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  // フィルターをリセット
  const resetFilters = () => {
    setSearchTerm("")
    setDepartmentFilter("all")
    setDateRange({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  // 全選択/解除の処理
  const handleSelectAll = () => {
    if (selectedItems.length === filteredOrders.length) {
      // すべて選択されている場合は選択解除
      setSelectedItems([])
    } else {
      // そうでない場合はすべて選択
      const allItemIds = filteredOrders.map((order) => order.id)
      setSelectedItems(allItemIds)
    }
  }

  // 区分ごとの全選択/解除の処理
  const handleSelectAllByType = (type: string) => {
    const typeItems = filteredOrders.filter((order) => order.issueType === type).map((order) => order.id)

    // すべて選択されているか確認
    const allSelected = typeItems.every((id) => selectedItems.includes(id))

    if (allSelected) {
      // すべて選択されている場合は選択解除
      setSelectedItems(selectedItems.filter((id) => !typeItems.includes(id)))
    } else {
      // そうでない場合は選択追加（既存の選択は維持）
      const newSelectedItems = [...selectedItems]
      typeItems.forEach((id) => {
        if (!newSelectedItems.includes(id)) {
          newSelectedItems.push(id)
        }
      })
      setSelectedItems(newSelectedItems)
    }
  }

  // 個別選択の処理
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      // 既に選択されている場合は選択解除
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
    } else {
      // そうでない場合は選択追加
      setSelectedItems([...selectedItems, id])
    }
  }

  // 処理実行ダイアログを開く
  const openProcessDialog = (type: string) => {
    // 選択されたアイテムのうち、指定された区分のものだけをフィルタリング
    const typeItems = filteredOrders
      .filter((order) => order.issueType === type && selectedItems.includes(order.id))
      .map((order) => order.id)

    if (typeItems.length === 0) {
      alert(`${issueTypeConfig[type].label}区分の発注データが選択されていません。`)
      return
    }

    setProcessingType(type)
    setIsProcessDialogOpen(true)
  }

  // 処理実行
  const handleProcess = () => {
    // 選択されたアイテムのうち、指定された区分のものだけをフィルタリング
    const typeItems = filteredOrders
      .filter((order) => order.issueType === processingType && selectedItems.includes(order.id))
      .map((order) => order.id)

    // 実際のアプリケーションではAPIを呼び出して処理を実行
    alert(`${typeItems.length}件の${issueTypeConfig[processingType].label}区分の発注データを処理しました。`)

    // 処理したアイテムの選択を解除
    setSelectedItems(selectedItems.filter((id) => !typeItems.includes(id)))
    setIsProcessDialogOpen(false)
  }

  // 区分ごとの統計情報
  const stats = {
    total: filteredOrders.length,
    email: filteredOrders.filter((order) => order.issueType === "email").length,
    print: filteredOrders.filter((order) => order.issueType === "print").length,
    upload: filteredOrders.filter((order) => order.issueType === "upload").length,
    other: filteredOrders.filter((order) => order.issueType === "other").length,
  }

  // 区分ごとの選択数
  const selectedStats = {
    email: filteredOrders.filter((order) => order.issueType === "email" && selectedItems.includes(order.id)).length,
    print: filteredOrders.filter((order) => order.issueType === "print" && selectedItems.includes(order.id)).length,
    upload: filteredOrders.filter((order) => order.issueType === "upload" && selectedItems.includes(order.id)).length,
    other: filteredOrders.filter((order) => order.issueType === "other" && selectedItems.includes(order.id)).length,
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">注文書発行</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="mr-2 h-4 w-4" />
            詳細フィルター
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* 選択状態表示 */}
      {selectedItems.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-md">
          <div className="flex items-center">
            <span className="font-medium">{selectedItems.length}件選択中</span>
            <span className="ml-2 text-sm text-muted-foreground">
              (メール: {selectedStats.email}件, 発注書出力: {selectedStats.print}件, Upload: {selectedStats.upload}件,
              その他: {selectedStats.other}件)
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
              選択解除
            </Button>
          </div>
        </div>
      )}

      {/* 処理ボタン */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                <p className="text-sm text-blue-600">メール</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-2">{stats.email}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                  onClick={() => handleSelectAllByType("email")}
                >
                  全選択
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600"
                  onClick={() => openProcessDialog("email")}
                  disabled={selectedStats.email === 0}
                >
                  処理実行
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <Printer className="h-5 w-5 mr-2 text-purple-600" />
                <p className="text-sm text-purple-600">発注書出力</p>
              </div>
              <p className="text-2xl font-bold text-purple-600 mb-2">{stats.print}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-300 text-purple-700"
                  onClick={() => handleSelectAllByType("print")}
                >
                  全選択
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600"
                  onClick={() => openProcessDialog("print")}
                  disabled={selectedStats.print === 0}
                >
                  処理実行
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <Upload className="h-5 w-5 mr-2 text-green-600" />
                <p className="text-sm text-green-600">Upload</p>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">{stats.upload}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 text-green-700"
                  onClick={() => handleSelectAllByType("upload")}
                >
                  全選択
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600"
                  onClick={() => openProcessDialog("upload")}
                  disabled={selectedStats.upload === 0}
                >
                  処理実行
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                <p className="text-sm text-gray-600">その他</p>
              </div>
              <p className="text-2xl font-bold text-gray-600 mb-2">{stats.other}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700"
                  onClick={() => handleSelectAllByType("other")}
                >
                  全選択
                </Button>
                <Button
                  size="sm"
                  className="bg-gray-600"
                  onClick={() => openProcessDialog("other")}
                  disabled={selectedStats.other === 0}
                >
                  処理実行
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索とフィルター */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="発注番号、取引先、件名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="部門" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての部門</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy年MM月dd日", { locale: ja })} -{" "}
                          {format(dateRange.to, "yyyy年MM月dd日", { locale: ja })}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy年MM月dd日", { locale: ja })
                      )
                    ) : (
                      "発注日で絞り込み"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isFilterOpen && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={resetFilters}>
                  フィルターをリセット
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* タブとテーブル */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList>
              <TabsTrigger value="all">すべて ({stats.total})</TabsTrigger>
              <TabsTrigger value="email">メール ({stats.email})</TabsTrigger>
              <TabsTrigger value="print">発注書出力 ({stats.print})</TabsTrigger>
              <TabsTrigger value="upload">Upload ({stats.upload})</TabsTrigger>
              <TabsTrigger value="other">その他 ({stats.other})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="rounded-md">
            <Table>
              <TableHeader className="bg-gradient-to-r from-amber-50 to-orange-100">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedItems.length > 0 && selectedItems.length === filteredOrders.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">発注番号</TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort("orderDate")}>
                      発注日
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>取引先</TableHead>
                  <TableHead>発注件名</TableHead>
                  <TableHead>発行区分</TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort("deliveryDate")}>
                      納期
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead className="text-right">
                    <div
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => handleSort("totalAmount")}
                    >
                      金額
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      該当する発注データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(order.id)}
                          onChange={() => handleSelectItem(order.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{format(order.orderDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                      <TableCell>{order.vendorName}</TableCell>
                      <TableCell>{order.orderTitle}</TableCell>
                      <TableCell>
                        <Badge className={issueTypeConfig[order.issueType].color}>
                          <span className="flex items-center">
                            {issueTypeConfig[order.issueType].icon}
                            <span className="ml-1">{issueTypeConfig[order.issueType].label}</span>
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{format(order.deliveryDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                      <TableCell>{order.departmentName}</TableCell>
                      <TableCell>{order.personInChargeName}</TableCell>
                      <TableCell className="text-right">
                        {order.totalAmount.toLocaleString()} {order.currency}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ページネーション */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {filteredOrders.length} 件中 {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} 件を表示
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 処理実行ダイアログ */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>処理実行確認</DialogTitle>
            <DialogDescription>
              選択した{processingType && issueTypeConfig[processingType].label}区分の発注データを処理します。
            </DialogDescription>
          </DialogHeader>

          {processingType && (
            <div className="py-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>処理内容の確認</AlertTitle>
                <AlertDescription>
                  {processingType === "email" && "選択した発注データをメールで送信します。"}
                  {processingType === "print" && "選択した発注データの発注書を出力します。"}
                  {processingType === "upload" && "選択した発注データをアップロードします。"}
                  {processingType === "other" && "選択した発注データに対してその他の処理を実行します。"}
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">処理対象</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">区分: </span>
                    <span>{issueTypeConfig[processingType].label}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">件数: </span>
                    <span>{selectedStats[processingType as keyof typeof selectedStats]}件</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleProcess}>処理実行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
