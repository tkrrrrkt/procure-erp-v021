"use client"

import type React from "react"

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
  SearchIcon,
  SlidersHorizontalIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  PackageCheck,
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

// 入荷ステータスの定義
type ArrivalStatus = "pending" | "partial" | "completed" | "issue" | "canceled"

// 入荷データの型定義
interface Arrival {
  id: string
  arrivalNumber: string
  poNumber: string
  arrivalDate: Date | null
  expectedDate: Date
  vendorId: string
  vendorName: string
  departmentId: string
  departmentName: string
  personInChargeId: string
  personInChargeName: string
  status: ArrivalStatus
  warehouseCode: string
  warehouseName: string
  inspectionRequired: boolean
  inspectionStatus: "pending" | "passed" | "failed" | "partial"
  createdAt: Date
  updatedAt: Date
}

// ステータスに対応するラベルとカラー
const statusConfig: Record<ArrivalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "入荷待ち",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4 mr-1" />,
  },
  partial: {
    label: "一部入荷",
    color: "bg-blue-100 text-blue-800",
    icon: <AlertCircle className="h-4 w-4 mr-1" />,
  },
  completed: {
    label: "入荷完了",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-4 w-4 mr-1" />,
  },
  issue: {
    label: "問題あり",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-4 w-4 mr-1" />,
  },
  canceled: {
    label: "キャンセル",
    color: "bg-gray-100 text-gray-800",
    icon: <XCircle className="h-4 w-4 mr-1" />,
  },
}

// 検品ステータスに対応するラベルとカラー
const inspectionStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "未検品", color: "bg-yellow-100 text-yellow-800" },
  passed: { label: "合格", color: "bg-green-100 text-green-800" },
  failed: { label: "不合格", color: "bg-red-100 text-red-800" },
  partial: { label: "一部合格", color: "bg-blue-100 text-blue-800" },
}

// サンプルデータ
const sampleArrivals: Arrival[] = [
  {
    id: "1",
    arrivalNumber: "ARV-2023-0001",
    poNumber: "PO-2023-0459",
    arrivalDate: new Date(2023, 11, 15),
    expectedDate: new Date(2023, 11, 15),
    vendorId: "1",
    vendorName: "株式会社山田製作所",
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "1",
    personInChargeName: "田中 健太",
    status: "completed",
    warehouseCode: "WH001",
    warehouseName: "本社倉庫",
    inspectionRequired: true,
    inspectionStatus: "passed",
    createdAt: new Date(2023, 11, 15, 10, 30),
    updatedAt: new Date(2023, 11, 15, 14, 45),
  },
  {
    id: "2",
    arrivalNumber: "ARV-2023-0002",
    poNumber: "PO-2023-0458",
    arrivalDate: new Date(2023, 11, 14),
    expectedDate: new Date(2023, 11, 16),
    vendorId: "3",
    vendorName: "大阪金属工業株式会社",
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "1",
    personInChargeName: "田中 健太",
    status: "partial",
    warehouseCode: "WH001",
    warehouseName: "本社倉庫",
    inspectionRequired: true,
    inspectionStatus: "partial",
    createdAt: new Date(2023, 11, 14, 9, 15),
    updatedAt: new Date(2023, 11, 14, 9, 30),
  },
  {
    id: "3",
    arrivalNumber: "ARV-2023-0003",
    poNumber: "PO-2023-0457",
    arrivalDate: null,
    expectedDate: new Date(2023, 11, 28),
    vendorId: "2",
    vendorName: "東京電子工業株式会社",
    departmentId: "2",
    departmentName: "開発部",
    personInChargeId: "3",
    personInChargeName: "鈴木 大輔",
    status: "pending",
    warehouseCode: "WH002",
    warehouseName: "東京倉庫",
    inspectionRequired: true,
    inspectionStatus: "pending",
    createdAt: new Date(2023, 11, 13, 13, 0),
    updatedAt: new Date(2023, 11, 13, 15, 20),
  },
  {
    id: "4",
    arrivalNumber: "ARV-2023-0004",
    poNumber: "PO-2023-0456",
    arrivalDate: new Date(2023, 11, 10),
    expectedDate: new Date(2023, 11, 20),
    vendorId: "5",
    vendorName: "福岡精密機器株式会社",
    departmentId: "3",
    departmentName: "営業部",
    personInChargeId: "2",
    personInChargeName: "佐藤 美咲",
    status: "issue",
    warehouseCode: "WH004",
    warehouseName: "福岡倉庫",
    inspectionRequired: true,
    inspectionStatus: "failed",
    createdAt: new Date(2023, 11, 10, 11, 45),
    updatedAt: new Date(2023, 11, 11, 9, 30),
  },
  {
    id: "5",
    arrivalNumber: "ARV-2023-0005",
    poNumber: "PO-2023-0455",
    arrivalDate: null,
    expectedDate: new Date(2023, 12, 15),
    vendorId: "4",
    vendorName: "名古屋機械工業株式会社",
    departmentId: "1",
    departmentName: "製造部",
    personInChargeId: "4",
    personInChargeName: "高橋 直子",
    status: "pending",
    warehouseCode: "WH003",
    warehouseName: "大阪倉庫",
    inspectionRequired: false,
    inspectionStatus: "pending",
    createdAt: new Date(2023, 11, 8, 10, 0),
    updatedAt: new Date(2023, 11, 9, 14, 15),
  },
  {
    id: "6",
    arrivalNumber: "ARV-2023-0006",
    poNumber: "PO-2023-0454",
    arrivalDate: null,
    expectedDate: new Date(2023, 11, 15),
    vendorId: "6",
    vendorName: "札幌工業株式会社",
    departmentId: "4",
    departmentName: "総務部",
    personInChargeId: "2",
    personInChargeName: "佐藤 美咲",
    status: "canceled",
    warehouseCode: "WH001",
    warehouseName: "本社倉庫",
    inspectionRequired: false,
    inspectionStatus: "pending",
    createdAt: new Date(2023, 11, 5, 9, 30),
    updatedAt: new Date(2023, 11, 5, 9, 30),
  },
]

// 部門データ
const departments = [
  { id: "1", name: "製造部" },
  { id: "2", name: "開発部" },
  { id: "3", name: "営業部" },
  { id: "4", name: "総務部" },
]

// 倉庫データ
const warehouses = [
  { code: "WH001", name: "本社倉庫" },
  { code: "WH002", name: "東京倉庫" },
  { code: "WH003", name: "大阪倉庫" },
  { code: "WH004", name: "福岡倉庫" },
]

export default function ArrivalsPage() {
  // 検索とフィルタリングのための状態
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all")
  const [inspectionFilter, setInspectionFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(sampleArrivals.length / itemsPerPage)

  // フィルタリングされた入荷リスト
  const filteredArrivals = sampleArrivals.filter((arrival) => {
    // 検索語句でフィルタリング
    const searchMatch =
      searchTerm === "" ||
      arrival.arrivalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arrival.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      arrival.vendorName.toLowerCase().includes(searchTerm.toLowerCase())

    // ステータスでフィルタリング
    const statusMatch = statusFilter === "all" || arrival.status === statusFilter

    // 部門でフィルタリング
    const departmentMatch = departmentFilter === "all" || arrival.departmentId === departmentFilter

    // 倉庫でフィルタリング
    const warehouseMatch = warehouseFilter === "all" || arrival.warehouseCode === warehouseFilter

    // 検品状態でフィルタリング
    const inspectionMatch = inspectionFilter === "all" || arrival.inspectionStatus === inspectionFilter

    // 日付範囲でフィルタリング（予定日）
    const dateMatch =
      (!dateRange.from || arrival.expectedDate >= dateRange.from) &&
      (!dateRange.to || arrival.expectedDate <= dateRange.to)

    return searchMatch && statusMatch && departmentMatch && warehouseMatch && inspectionMatch && dateMatch
  })

  // ページネーション処理
  const paginatedArrivals = filteredArrivals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // フィルターをリセット
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDepartmentFilter("all")
    setWarehouseFilter("all")
    setInspectionFilter("all")
    setDateRange({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">入荷一覧</h1>
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
            <Link href="/receiving/arrivals/new">
              <PackageCheck className="mr-2 h-4 w-4" />
              入荷処理
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
                  placeholder="入荷番号、発注番号、取引先で検索..."
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
                  <SelectItem value="pending">入荷待ち</SelectItem>
                  <SelectItem value="partial">一部入荷</SelectItem>
                  <SelectItem value="completed">入荷完了</SelectItem>
                  <SelectItem value="issue">問題あり</SelectItem>
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
                      "入荷予定日で絞り込み"
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
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="倉庫" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての倉庫</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.code} value={wh.code}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={inspectionFilter} onValueChange={setInspectionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="検品状態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての検品状態</SelectItem>
                    <SelectItem value="pending">未検品</SelectItem>
                    <SelectItem value="passed">合格</SelectItem>
                    <SelectItem value="failed">不合格</SelectItem>
                    <SelectItem value="partial">一部合格</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end md:col-span-3">
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
                <TableHead className="w-[120px]">入荷番号</TableHead>
                <TableHead>発注番号</TableHead>
                <TableHead>取引先</TableHead>
                <TableHead>入荷予定日</TableHead>
                <TableHead>入荷日</TableHead>
                <TableHead>倉庫</TableHead>
                <TableHead>部門</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>入荷状態</TableHead>
                <TableHead>検品状態</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArrivals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    該当する入荷データがありません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedArrivals.map((arrival) => (
                  <TableRow key={arrival.id}>
                    <TableCell className="font-medium">{arrival.arrivalNumber}</TableCell>
                    <TableCell>{arrival.poNumber}</TableCell>
                    <TableCell>{arrival.vendorName}</TableCell>
                    <TableCell>{format(arrival.expectedDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>
                      {arrival.arrivalDate ? format(arrival.arrivalDate, "yyyy/MM/dd", { locale: ja }) : "-"}
                    </TableCell>
                    <TableCell>{arrival.warehouseName}</TableCell>
                    <TableCell>{arrival.departmentName}</TableCell>
                    <TableCell>{arrival.personInChargeName}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[arrival.status].color}>
                        <div className="flex items-center">
                          {statusConfig[arrival.status].icon}
                          {statusConfig[arrival.status].label}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={inspectionStatusConfig[arrival.inspectionStatus].color}>
                        {inspectionStatusConfig[arrival.inspectionStatus].label}
                      </Badge>
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
                            <Link href={`/receiving/arrivals/${arrival.id}`}>
                              <FileTextIcon className="mr-2 h-4 w-4" />
                              詳細を表示
                            </Link>
                          </DropdownMenuItem>
                          {arrival.status !== "completed" && arrival.status !== "canceled" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/receiving/arrivals/${arrival.id}/edit`}>
                                <PackageCheck className="mr-2 h-4 w-4" />
                                入荷処理
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileTextIcon className="mr-2 h-4 w-4" />
                            入荷票を印刷
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {arrival.status === "pending" && (
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              キャンセル
                            </DropdownMenuItem>
                          )}
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
      {filteredArrivals.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {filteredArrivals.length} 件中 {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredArrivals.length)} 件を表示
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
