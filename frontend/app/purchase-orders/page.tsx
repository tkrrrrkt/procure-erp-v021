"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
  deliveryType: "company" | "customer"
  deliveryLocation: string
  createdAt: Date
  updatedAt: Date
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
    totalAmount: 16500,
    currency: "JPY",
    orderTitle: "製造部材料発注 12月分",
    deliveryType: "company",
    deliveryLocation: "倉庫2",
    createdAt: new Date(2023, 11, 15, 10, 30),
    updatedAt: new Date(2023, 11, 15, 14, 45),
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
    status: "completed",
    totalAmount: 45000,
    currency: "JPY",
    orderTitle: "特急部品発注",
    deliveryType: "company",
    deliveryLocation: "倉庫1",
    createdAt: new Date(2023, 11, 14, 9, 15),
    updatedAt: new Date(2023, 11, 14, 9, 30),
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
    status: "pending",
    totalAmount: 120000,
    currency: "JPY",
    orderTitle: "開発用電子部品",
    deliveryType: "customer",
    deliveryLocation: "東京本社",
    createdAt: new Date(2023, 11, 13, 13, 0),
    updatedAt: new Date(2023, 11, 13, 15, 20),
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
    status: "rejected",
    totalAmount: 78500,
    currency: "JPY",
    orderTitle: "デモ用サンプル部品",
    deliveryType: "customer",
    deliveryLocation: "大阪支店",
    createdAt: new Date(2023, 11, 10, 11, 45),
    updatedAt: new Date(2023, 11, 11, 9, 30),
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
    totalAmount: 350000,
    currency: "JPY",
    orderTitle: "1月-3月期定期発注",
    deliveryType: "company",
    deliveryLocation: "倉庫3",
    createdAt: new Date(2023, 11, 8, 10, 0),
    updatedAt: new Date(2023, 11, 9, 14, 15),
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
    status: "draft",
    totalAmount: 25000,
    currency: "JPY",
    orderTitle: "事務用品発注",
    deliveryType: "company",
    deliveryLocation: "倉庫2",
    createdAt: new Date(2023, 11, 5, 9, 30),
    updatedAt: new Date(2023, 11, 5, 9, 30),
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
    status: "canceled",
    totalAmount: 65000,
    currency: "JPY",
    orderTitle: "試作品用部材",
    deliveryType: "company",
    deliveryLocation: "倉庫1",
    createdAt: new Date(2023, 11, 1, 13, 45),
    updatedAt: new Date(2023, 11, 2, 10, 30),
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
    status: "completed",
    totalAmount: 42000,
    currency: "JPY",
    orderTitle: "試験用部品緊急発注",
    deliveryType: "customer",
    deliveryLocation: "名古屋工場",
    createdAt: new Date(2023, 10, 28, 15, 0),
    updatedAt: new Date(2023, 10, 28, 16, 30),
  },
]

// 部門データ
const departments = [
  { id: "1", name: "製造部" },
  { id: "2", name: "開発部" },
  { id: "3", name: "営業部" },
  { id: "4", name: "総務部" },
]

// 発注形態データ
const orderTypes = [
  { id: "regular", name: "通常発注" },
  { id: "urgent", name: "緊急発注" },
  { id: "planned", name: "計画発注" },
  { id: "blanket", name: "包括発注" },
]

export default function PurchaseOrdersPage() {
  // 検索とフィルタリングのための状態
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(samplePurchaseOrders.length / itemsPerPage)

  // フィルタリングされた発注リスト
  const filteredOrders = samplePurchaseOrders.filter((order) => {
    // 検索語句でフィルタリング
    const searchMatch =
      searchTerm === "" ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderTitle.toLowerCase().includes(searchTerm.toLowerCase())

    // ステータスでフィルタリング
    const statusMatch = statusFilter === "all" || order.status === statusFilter

    // 部門でフィルタリング
    const departmentMatch = departmentFilter === "all" || order.departmentId === departmentFilter

    // 発注形態でフィルタリング
    const orderTypeMatch = orderTypeFilter === "all" || order.orderType === orderTypeFilter

    // 日付範囲でフィルタリング
    const dateMatch =
      (!dateRange.from || order.orderDate >= dateRange.from) && (!dateRange.to || order.orderDate <= dateRange.to)

    return searchMatch && statusMatch && departmentMatch && orderTypeMatch && dateMatch
  })

  // ページネーション処理
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // フィルターをリセット
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDepartmentFilter("all")
    setOrderTypeFilter("all")
    setDateRange({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">発注一覧</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            フィルター
          </Button>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button asChild>
            <Link href="/purchase-orders/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              発注入力
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="発注番号、取引先、件名で検索..."
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
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
                <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="発注形態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての発注形態</SelectItem>
                    {orderTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={resetFilters}>
                    フィルターをリセット
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
              <TableRow>
                <TableHead className="w-[120px]">発注番号</TableHead>
                <TableHead>発注日</TableHead>
                <TableHead>取引先</TableHead>
                <TableHead>発注件名</TableHead>
                <TableHead>発注形態</TableHead>
                <TableHead>納期</TableHead>
                <TableHead>部門</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    該当する発注データがありません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(order.orderDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>{order.vendorName}</TableCell>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <SlidersHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/purchase-orders/${order.id}`}>
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              詳細を表示
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/purchase-orders/${order.id}/edit`}>
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              編集
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileTextIcon className="mr-2 h-4 w-4" />
                            発注書を印刷
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileTextIcon className="mr-2 h-4 w-4" />
                            発注書をメール送信
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <FileTextIcon className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    </div>
  )
}
