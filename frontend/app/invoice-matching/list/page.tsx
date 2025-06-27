"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Clock, Filter, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

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
}

// サンプルデータ
const sampleMatchingResults: MatchingResult[] = [
  {
    id: "match-001",
    purchaseOrderId: "po-001",
    purchaseOrderNumber: "PO-2023-0459",
    invoiceId: "inv-001",
    invoiceNumber: "INV-20231220-001",
    vendorId: "v-001",
    vendorName: "株式会社山田製作所",
    matchingDate: new Date(2023, 11, 21),
    status: "matched",
    matchRate: 100,
    poAmount: 16500,
    invoiceAmount: 16500,
    amountDifference: 0,
    itemCount: 2,
    matchedItemCount: 2,
    currency: "JPY",
    processingStatus: "approved",
    processingDate: new Date(2023, 11, 22),
    processedBy: "田中 健太",
  },
  {
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
  },
  {
    id: "match-003",
    purchaseOrderId: "po-003",
    purchaseOrderNumber: "PO-2023-0457",
    invoiceId: "inv-003",
    invoiceNumber: "INV-20231215-003",
    vendorId: "v-002",
    vendorName: "東京電子工業株式会社",
    matchingDate: new Date(2023, 11, 16),
    status: "mismatch",
    matchRate: 30,
    poAmount: 120000,
    invoiceAmount: 135000,
    amountDifference: 15000,
    itemCount: 3,
    matchedItemCount: 1,
    currency: "JPY",
    processingStatus: "rejected",
    processingDate: new Date(2023, 11, 17),
    processedBy: "鈴木 大輔",
  },
  {
    id: "match-004",
    purchaseOrderId: "po-004",
    purchaseOrderNumber: "PO-2023-0456",
    invoiceId: "inv-004",
    invoiceNumber: "INV-20231210-004",
    vendorId: "v-005",
    vendorName: "福岡精密機器株式会社",
    matchingDate: new Date(2023, 11, 12),
    status: "partial_match",
    matchRate: 85,
    poAmount: 78500,
    invoiceAmount: 78500,
    amountDifference: 0,
    itemCount: 4,
    matchedItemCount: 3,
    currency: "JPY",
    processingStatus: "modified",
    processingDate: new Date(2023, 11, 13),
    processedBy: "佐藤 美咲",
  },
  {
    id: "match-005",
    purchaseOrderId: "po-005",
    purchaseOrderNumber: "PO-2023-0455",
    invoiceId: "inv-005",
    invoiceNumber: "INV-20231208-005",
    vendorId: "v-004",
    vendorName: "名古屋機械工業株式会社",
    matchingDate: new Date(2023, 11, 9),
    status: "matched",
    matchRate: 100,
    poAmount: 350000,
    invoiceAmount: 350000,
    amountDifference: 0,
    itemCount: 5,
    matchedItemCount: 5,
    currency: "JPY",
    processingStatus: "approved",
    processingDate: new Date(2023, 11, 10),
    processedBy: "高橋 直子",
  },
  {
    id: "match-006",
    purchaseOrderId: "po-006",
    purchaseOrderNumber: "PO-2023-0454",
    invoiceId: "inv-006",
    invoiceNumber: "INV-20231205-006",
    vendorId: "v-006",
    vendorName: "札幌工業株式会社",
    matchingDate: new Date(2023, 11, 6),
    status: "mismatch",
    matchRate: 20,
    poAmount: 25000,
    invoiceAmount: 32000,
    amountDifference: 7000,
    itemCount: 3,
    matchedItemCount: 0,
    currency: "JPY",
    processingStatus: "pending",
  },
  {
    id: "match-007",
    purchaseOrderId: "po-007",
    purchaseOrderNumber: "PO-2023-0453",
    invoiceId: "inv-007",
    invoiceNumber: "INV-20231202-007",
    vendorId: "v-007",
    vendorName: "仙台金属加工株式会社",
    matchingDate: new Date(2023, 11, 3),
    status: "partial_match",
    matchRate: 60,
    poAmount: 65000,
    invoiceAmount: 68000,
    amountDifference: 3000,
    itemCount: 2,
    matchedItemCount: 1,
    currency: "JPY",
    processingStatus: "modified",
    processingDate: new Date(2023, 11, 4),
    processedBy: "田中 健太",
  },
  {
    id: "match-008",
    purchaseOrderId: "po-008",
    purchaseOrderNumber: "PO-2023-0452",
    invoiceId: "inv-008",
    invoiceNumber: "INV-20231130-008",
    vendorId: "v-008",
    vendorName: "広島製作所",
    matchingDate: new Date(2023, 11, 1),
    status: "matched",
    matchRate: 100,
    poAmount: 42000,
    invoiceAmount: 42000,
    amountDifference: 0,
    itemCount: 1,
    matchedItemCount: 1,
    currency: "JPY",
    processingStatus: "approved",
    processingDate: new Date(2023, 11, 2),
    processedBy: "鈴木 大輔",
  },
]

export default function InvoiceMatchingListPage() {
  // 状態管理
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [processingStatusFilter, setProcessingStatusFilter] = useState<string>("all")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [currentTab, setCurrentTab] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "matchingDate",
    direction: "desc",
  })

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 状態管理の部分に選択状態を管理するための state を追加
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // フィルタリングとソート
  const filteredResults = sampleMatchingResults
    .filter((result) => {
      // タブフィルター
      if (currentTab === "pending" && result.processingStatus !== "pending") return false
      if (currentTab === "processed" && result.processingStatus === "pending") return false

      // 検索語句でフィルタリング
      const searchMatch =
        searchTerm === "" ||
        result.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.vendorName.toLowerCase().includes(searchTerm.toLowerCase())

      // マッチングステータスでフィルタリング
      const statusMatch = statusFilter === "all" || result.status === statusFilter

      // 処理ステータスでフィルタリング
      const processingStatusMatch =
        processingStatusFilter === "all" || result.processingStatus === processingStatusFilter

      // 取引先でフィルタリング
      const vendorMatch = vendorFilter === "all" || result.vendorId === vendorFilter

      // 日付範囲でフィルタリング
      const dateMatch =
        (!dateRange.from || result.matchingDate >= dateRange.from) &&
        (!dateRange.to || result.matchingDate <= dateRange.to)

      return searchMatch && statusMatch && processingStatusMatch && vendorMatch && dateMatch
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig

      if (key === "matchingDate") {
        return direction === "asc"
          ? a.matchingDate.getTime() - b.matchingDate.getTime()
          : b.matchingDate.getTime() - a.matchingDate.getTime()
      }

      if (key === "matchRate") {
        return direction === "asc" ? a.matchRate - b.matchRate : b.matchRate - a.matchRate
      }

      if (key === "amountDifference") {
        return direction === "asc"
          ? Math.abs(a.amountDifference) - Math.abs(b.amountDifference)
          : Math.abs(b.amountDifference) - Math.abs(a.amountDifference)
      }

      return 0
    })

  // ページネーション処理
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const paginatedResults = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
    setProcessingStatusFilter("all")
    setVendorFilter("all")
    setDateRange({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  // ステータスに応じたバッジの色を取得
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "matched":
        return "bg-green-100 text-green-800"
      case "partial_match":
        return "bg-yellow-100 text-yellow-800"
      case "mismatch":
        return "bg-red-100 text-red-800"
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
      default:
        return status
    }
  }

  // 処理ステータスに応じたバッジの色を取得
  const getProcessingStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "modified":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // 処理ステータスに応じたラベルを取得
  const getProcessingStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "承認済"
      case "rejected":
        return "差戻し"
      case "modified":
        return "修正済"
      case "pending":
        return "未処理"
      default:
        return status
    }
  }

  // 一意の取引先リストを取得
  const uniqueVendors = Array.from(new Set(sampleMatchingResults.map((result) => result.vendorId))).map((vendorId) => {
    const vendor = sampleMatchingResults.find((result) => result.vendorId === vendorId)
    return {
      id: vendorId,
      name: vendor ? vendor.vendorName : "",
    }
  })

  // 統計情報
  const stats = {
    total: filteredResults.length,
    matched: filteredResults.filter((r) => r.status === "matched").length,
    partialMatch: filteredResults.filter((r) => r.status === "partial_match").length,
    mismatch: filteredResults.filter((r) => r.status === "mismatch").length,
    pending: filteredResults.filter((r) => r.processingStatus === "pending").length,
    processed: filteredResults.filter((r) => r.processingStatus !== "pending").length,
  }

  // 全選択/解除の処理を追加
  const handleSelectAll = () => {
    if (selectedItems.length === filteredResults.filter((r) => r.status === "matched").length) {
      // すべて選択されている場合は選択解除
      setSelectedItems([])
    } else {
      // そうでない場合は完全一致のアイテムをすべて選択
      const matchedItemIds = filteredResults.filter((r) => r.status === "matched").map((r) => r.id)
      setSelectedItems(matchedItemIds)
    }
  }

  // 個別選択の処理を追加
  const handleSelectItem = (id: string, isMatched: boolean) => {
    if (!isMatched) return // 完全一致でない場合は選択不可

    if (selectedItems.includes(id)) {
      // 既に選択されている場合は選択解除
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
    } else {
      // そうでない場合は選択追加
      setSelectedItems([...selectedItems, id])
    }
  }

  // 一括仕入データ作成処理を追加
  const handleBulkCreateReceiving = () => {
    if (selectedItems.length === 0) {
      alert("仕入データを作成する明細を選択してください")
      return
    }

    // 選択された明細を取得
    const selectedResults = filteredResults.filter((result) => selectedItems.includes(result.id))

    // 確認ダイアログを表示
    if (confirm(`選択された ${selectedItems.length} 件のマッチング結果から仕入データを作成しますか？`)) {
      alert(`${selectedItems.length} 件の仕入データが作成されました。`)
      // 選択をクリア
      setSelectedItems([])

      // 実際のアプリケーションでは、作成された仕入データの一覧画面に遷移するなどの処理を追加
      // router.push('/receiving');
    }
  }

  // 仕入データ作成処理を追加
  const handleCreateReceiving = (matchingResult: MatchingResult) => {
    // 実際のアプリケーションではAPIを呼び出して仕入データを作成
    if (matchingResult.status !== "matched") {
      alert("完全一致のデータのみ仕入データを作成できます")
      return
    }

    // 確認ダイアログを表示
    if (confirm(`マッチング結果 ${matchingResult.id} から仕入データを作成しますか？`)) {
      alert(
        `仕入データが作成されました。仕入番号: RCV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
      )

      // 実際のアプリケーションでは、作成された仕入データの画面に遷移
      // router.push(`/receiving/${newReceivingId}`);
    }
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">請求書マッチング確認</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="mr-2 h-4 w-4" />
            詳細フィルター
          </Button>
          <Button asChild>
            <Link href="/invoice-matching/batch">
              <Clock className="mr-2 h-4 w-4" />
              バッチ処理実行
            </Link>
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {selectedItems.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-md">
          <div className="flex items-center">
            <span className="font-medium">{selectedItems.length}件選択中</span>
            <span className="ml-2 text-sm text-muted-foreground">(完全一致のデータのみ選択可能です)</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
              選択解除
            </Button>
            <Button size="sm" onClick={handleBulkCreateReceiving}>
              <FileText className="mr-1 h-4 w-4" />
              選択した明細から仕入データ作成
            </Button>
          </div>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground">全件数</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-green-600">完全一致</p>
              <p className="text-3xl font-bold text-green-600">{stats.matched}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-yellow-600">部分一致</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.partialMatch}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-red-600">不一致</p>
              <p className="text-3xl font-bold text-red-600">{stats.mismatch}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-600">未処理</p>
              <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-blue-600">処理済</p>
              <p className="text-3xl font-bold text-blue-600">{stats.processed}</p>
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
                  placeholder="発注番号、請求書番号、取引先で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="マッチング状態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての状態</SelectItem>
                  <SelectItem value="matched">完全一致</SelectItem>
                  <SelectItem value="partial_match">部分一致</SelectItem>
                  <SelectItem value="mismatch">不一致</SelectItem>
                </SelectContent>
              </Select>
              <Select value={processingStatusFilter} onValueChange={setProcessingStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="処理状態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての状態</SelectItem>
                  <SelectItem value="pending">未処理</SelectItem>
                  <SelectItem value="approved">承認済</SelectItem>
                  <SelectItem value="rejected">差戻し</SelectItem>
                  <SelectItem value="modified">修正済</SelectItem>
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
                      "マッチング日で絞り込み"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="取引先" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての取引先</SelectItem>
                    {uniqueVendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end md:col-span-2">
                  <Button variant="outline" onClick={resetFilters}>
                    フィルターをリセット
                  </Button>
                </div>
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
              <TabsTrigger value="all">すべて ({filteredResults.length})</TabsTrigger>
              <TabsTrigger value="pending">未処理 ({stats.pending})</TabsTrigger>
              <TabsTrigger value="processed">処理済 ({stats.processed})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="rounded-md">
            <Table>
              <TableHeader className="bg-gradient-to-r from-purple-50 to-violet-100">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.length > 0 &&
                        selectedItems.length === filteredResults.filter((r) => r.status === "matched").length
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">発注番号</TableHead>
                  <TableHead className="w-[120px]">請求書番号</TableHead>
                  <TableHead>取引先</TableHead>
                  <TableHead className="w-[100px]">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort("matchingDate")}>
                      マッチング日
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>マッチング状態</TableHead>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort("matchRate")}>
                      一致率
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">発注金額</TableHead>
                  <TableHead className="text-right">請求金額</TableHead>
                  <TableHead className="text-right">
                    <div
                      className="flex items-center justify-end cursor-pointer"
                      onClick={() => handleSort("amountDifference")}
                    >
                      差額
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>処理状態</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                      該当するマッチングデータがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedResults.map((result) => (
                    <TableRow
                      key={result.id}
                      className={
                        result.status === "matched"
                          ? "bg-green-50/30"
                          : result.status === "partial_match"
                            ? "bg-yellow-50/30"
                            : "bg-red-50/30"
                      }
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(result.id)}
                          onChange={() => handleSelectItem(result.id, result.status === "matched")}
                          disabled={result.status !== "matched"}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{result.purchaseOrderNumber}</TableCell>
                      <TableCell>{result.invoiceNumber}</TableCell>
                      <TableCell>{result.vendorName}</TableCell>
                      <TableCell>{format(result.matchingDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(result.status)}>{getStatusLabel(result.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={result.matchRate} className="h-2 w-20" />
                          <span>{result.matchRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {result.poAmount.toLocaleString()} {result.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.invoiceAmount.toLocaleString()} {result.currency}
                      </TableCell>
                      <TableCell
                        className={cn("text-right", result.amountDifference !== 0 ? "text-red-600 font-medium" : "")}
                      >
                        {result.amountDifference === 0
                          ? "-"
                          : `${result.amountDifference > 0 ? "+" : ""}${result.amountDifference.toLocaleString()} ${result.currency}`}
                      </TableCell>
                      <TableCell>
                        <Badge className={getProcessingStatusBadgeColor(result.processingStatus)}>
                          {getProcessingStatusLabel(result.processingStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/invoice-matching/detail/${result.id}`}>
                              <Search className="mr-1 h-4 w-4" />
                              詳細
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={result.status !== "matched"}
                            onClick={() => handleCreateReceiving(result)}
                            title={
                              result.status !== "matched"
                                ? "完全一致のデータのみ仕入データを作成できます"
                                : "仕入データを作成"
                            }
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            仕入作成
                          </Button>
                        </div>
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
      {filteredResults.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {filteredResults.length} 件中 {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredResults.length)} 件を表示
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
    </div>
  )
}
