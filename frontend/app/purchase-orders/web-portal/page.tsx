"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  ArrowUpDown,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  Eye,
  FilterIcon,
  SearchIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// 発注ステータスの定義
type OrderStatus = "draft" | "pending" | "approved" | "rejected" | "completed" | "canceled"

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
  status: OrderStatus
  totalAmount: number
  currency: string
  orderTitle: string
  pdfUrl: string
}

// ステータスに対応するラベルとカラー
const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-200 text-gray-800" },
  pending: { label: "承認待ち", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済", color: "bg-green-100 text-green-800" },
  rejected: { label: "却下", color: "bg-red-100 text-red-800" },
  completed: { label: "完了", color: "bg-blue-100 text-blue-800" },
  canceled: { label: "キャンセル", color: "bg-gray-100 text-gray-800" },
}

// 発注形態のラベル
const orderTypeLabels: Record<string, string> = {
  regular: "通常発注",
  urgent: "緊急発注",
  planned: "計画発注",
  blanket: "包括発注",
}

// サンプルデータ - 現在ログインしている仕入先向けの発注データのみ
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
    totalAmount: 16500,
    currency: "JPY",
    orderTitle: "製造部材料発注 12月分",
    pdfUrl: "/sample-po.pdf",
  },
  {
    id: "2",
    orderNumber: "PO-2023-0458",
    orderDate: new Date(2023, 11, 14),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    orderType: "urgent",
    orderTypeLabel: "緊急発注",
    deliveryDate: new Date(2023, 11, 16),
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "1",
    personInChargeName: "田中 健太",
    status: "completed",
    totalAmount: 45000,
    currency: "JPY",
    orderTitle: "特急部品発注",
    pdfUrl: "/sample-po.pdf",
  },
  {
    id: "3",
    orderNumber: "PO-2023-0457",
    orderDate: new Date(2023, 11, 13),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    orderType: "planned",
    orderTypeLabel: "計画発注",
    deliveryDate: new Date(2023, 11, 28),
    departmentId: "2",
    departmentName: "開発部",
    personInChargeId: "3",
    personInChargeName: "鈴木 大輔",
    status: "pending",
    totalAmount: 120000,
    currency: "JPY",
    orderTitle: "開発用電子部品",
    pdfUrl: "/sample-po.pdf",
  },
  {
    id: "4",
    orderNumber: "PO-2023-0456",
    orderDate: new Date(2023, 11, 10),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 20),
    departmentId: "3",
    departmentName: "営業部",
    personInChargeId: "2",
    personInChargeName: "佐藤 美咲",
    status: "rejected",
    totalAmount: 78500,
    currency: "JPY",
    orderTitle: "デモ用サンプル部品",
    pdfUrl: "/sample-po.pdf",
  },
  {
    id: "5",
    orderNumber: "PO-2023-0455",
    orderDate: new Date(2023, 11, 8),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    orderType: "blanket",
    orderTypeLabel: "包括発注",
    deliveryDate: new Date(2023, 12, 15),
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "4",
    personInChargeName: "高橋 直子",
    status: "approved",
    totalAmount: 350000,
    currency: "JPY",
    orderTitle: "1月-3月期定期発注",
    pdfUrl: "/sample-po.pdf",
  },
  {
    id: "6",
    orderNumber: "PO-2023-0454",
    orderDate: new Date(2023, 11, 5),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    orderType: "regular",
    orderTypeLabel: "通常発注",
    deliveryDate: new Date(2023, 11, 15),
    departmentId: "4",
    departmentName: "総務部",
    personInChargeId: "2",
    personInChargeName: "佐藤 美咲",
    status: "draft",
    totalAmount: 25000,
    currency: "JPY",
    orderTitle: "事務用品発注",
    pdfUrl: "/sample-po.pdf",
  },
]

export default function WebPortalPage() {
  // 検索とフィルタリングのための状態
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "orderDate",
    direction: "desc",
  })

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // PDF表示用の状態
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  // フィルタリングとソート
  const filteredOrders = samplePurchaseOrders
    .filter((order) => {
      // 検索語句でフィルタリング
      const searchMatch =
        searchTerm === "" ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderTitle.toLowerCase().includes(searchTerm.toLowerCase())

      // ステータスでフィルタリング
      const statusMatch = statusFilter === "all" || order.status === statusFilter

      // 日付範囲でフィルタリング
      const dateMatch =
        (!dateRange.from || order.orderDate >= dateRange.from) && (!dateRange.to || order.orderDate <= dateRange.to)

      return searchMatch && statusMatch && dateMatch
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
    setStatusFilter("all")
    setDateRange({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  // 発注書PDFを表示
  const viewPurchaseOrderPdf = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setShowPdfViewer(true)
  }

  // 発注書PDFをダウンロード
  const downloadPurchaseOrderPdf = (order: PurchaseOrder) => {
    // 実際のアプリケーションではここでPDFのダウンロード処理を行う
    // この例ではサンプルとしてリンクをクリックする形で実装
    const link = document.createElement("a")
    link.href = order.pdfUrl
    link.download = `${order.orderNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Web発注照会</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            フィルター
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">全件数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">承認済</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {filteredOrders.filter((order) => order.status === "approved").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">承認待ち</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredOrders.filter((order) => order.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">完了</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {filteredOrders.filter((order) => order.status === "completed").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">その他</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">
              {filteredOrders.filter((order) => !["approved", "pending", "completed"].includes(order.status)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="発注番号、発注件名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="pending">承認待ち</SelectItem>
                  <SelectItem value="approved">承認済</SelectItem>
                  <SelectItem value="rejected">却下</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="canceled">キャンセル</SelectItem>
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
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                  <Calendar
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-cyan-50 to-blue-100">
              <TableRow>
                <TableHead className="w-[120px]">発注番号</TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("orderDate")}>
                    発注日
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>発注件名</TableHead>
                <TableHead>発注形態</TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("deliveryDate")}>
                    納期
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>部門</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">
                  <div
                    className="flex items-center justify-end cursor-pointer"
                    onClick={() => handleSort("totalAmount")}
                  >
                    金額
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
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
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(order.orderDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>{order.orderTitle}</TableCell>
                    <TableCell>{order.orderTypeLabel}</TableCell>
                    <TableCell>{format(order.deliveryDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>{order.departmentName}</TableCell>
                    <TableCell>{order.personInChargeName}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[order.status].color}>{statusConfig[order.status].label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.totalAmount.toLocaleString()} {order.currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="icon" onClick={() => viewPurchaseOrderPdf(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => downloadPurchaseOrderPdf(order)}>
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
              <ChevronLeftIcon className="h-4 w-4" />
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
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF表示ダイアログ */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.orderNumber} - {selectedOrder?.orderTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-[70vh] border rounded-md overflow-auto">
            <iframe
              src={selectedOrder?.pdfUrl}
              className="w-full h-full"
              title={`発注書 ${selectedOrder?.orderNumber}`}
            />
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowPdfViewer(false)}>
              閉じる
            </Button>
            <Button onClick={() => selectedOrder && downloadPurchaseOrderPdf(selectedOrder)}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              ダウンロード
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
