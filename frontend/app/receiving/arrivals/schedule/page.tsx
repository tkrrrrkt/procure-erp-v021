"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  CalendarIcon,
  DownloadIcon,
  SearchIcon,
  RefreshCw,
  Truck,
  Package,
  Building,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// 入荷予定データの型定義
interface ArrivalSchedule {
  id: string
  expectedDate: Date
  vendorName: string
  productCode: string
  productName: string
  productSpecification: string
  departmentName: string
  personInChargeName: string
  poNumber: string
  deliveryDate: Date
  orderQuantity: number
  remainingQuantity: number
  unit: string
  status: "通常" | "緊急" | "遅延" | "一部入荷済"
}

// 倉庫データ
const warehouses = [
  { code: "WH001", name: "本社倉庫" },
  { code: "WH002", name: "東京倉庫" },
  { code: "WH003", name: "大阪倉庫" },
  { code: "WH004", name: "福岡倉庫" },
]

// 部門データ
const departments = [
  { code: "DEPT001", name: "製造部" },
  { code: "DEPT002", name: "開発部" },
  { code: "DEPT003", name: "営業部" },
  { code: "DEPT004", name: "総務部" },
]

// 担当者データ
const persons = [
  { code: "EMP001", name: "田中 健太", departmentCode: "DEPT001" },
  { code: "EMP002", name: "佐藤 美咲", departmentCode: "DEPT001" },
  { code: "EMP003", name: "鈴木 大輔", departmentCode: "DEPT002" },
  { code: "EMP004", name: "高橋 直子", departmentCode: "DEPT002" },
  { code: "EMP005", name: "渡辺 隆", departmentCode: "DEPT003" },
  { code: "EMP006", name: "伊藤 裕子", departmentCode: "DEPT003" },
  { code: "EMP007", name: "山本 和也", departmentCode: "DEPT004" },
  { code: "EMP008", name: "中村 洋子", departmentCode: "DEPT004" },
]

// 仕入先データ
const vendors = [
  { code: "E006-51", name: "医療機器" },
  { code: "V002", name: "東京電子工業株式会社" },
  { code: "V003", name: "大阪金属工業株式会社" },
  { code: "V004", name: "名古屋機械工業株式会社" },
  { code: "V005", name: "福岡精密機器株式会社" },
  { code: "V006", name: "札幌工業株式会社" },
  { code: "V007", name: "仙台金属加工株式会社" },
  { code: "V008", name: "広島製作所" },
]

// 商品データ
const products = [
  { code: "D501", name: "内視鏡手術トレーニングシミュレータ", specification: "全社" },
  { code: "P002", name: "ステンレス板 SUS304", specification: "t1.5×500×1000" },
  { code: "P003", name: "銅板 C1100P", specification: "t1.0×100×200" },
  { code: "P004", name: "真鍮板 C2801P", specification: "t0.5×150×300" },
  { code: "P005", name: "鉄板 SPHC", specification: "t3.2×600×900" },
  { code: "P006", name: "チタン板 Grade2", specification: "t1.0×200×300" },
  { code: "P007", name: "アクリル板", specification: "t5.0×600×900 透明" },
  { code: "P008", name: "ポリカーボネート板", specification: "t3.0×600×900 透明" },
]

// 形態（ステータス）データ
const statusOptions = [
  { value: "通常", label: "通常", color: "bg-green-100 text-green-800" },
  { value: "緊急", label: "緊急", color: "bg-red-100 text-red-800" },
  { value: "遅延", label: "遅延", color: "bg-yellow-100 text-yellow-800" },
  { value: "一部入荷済", label: "一部入荷済", color: "bg-blue-100 text-blue-800" },
]

// サンプルデータ生成
const generateSampleData = (): ArrivalSchedule[] => {
  const statuses: ("通常" | "緊急" | "遅延" | "一部入荷済")[] = ["通常", "緊急", "遅延", "一部入荷済"]
  const units = ["式", "kg", "個", "セット", "m"]

  // サンプルデータとして画像のデータを含める
  const sampleData: ArrivalSchedule[] = [
    {
      id: "AS0001",
      expectedDate: new Date(),
      vendorName: "医療機器",
      productCode: "D501",
      productName: "内視鏡手術トレーニングシミュレータ",
      productSpecification: "全社",
      departmentName: "全社",
      personInChargeName: "ADMIN",
      poNumber: "P00000287 (1)",
      deliveryDate: new Date(),
      orderQuantity: 2.0,
      remainingQuantity: 2.0,
      unit: "式",
      status: "通常",
    },
  ]

  // 追加のサンプルデータを生成
  for (let i = 0; i < 19; i++) {
    const vendorIndex = Math.floor(Math.random() * vendors.length)
    const productIndex = Math.floor(Math.random() * products.length)
    const departmentIndex = Math.floor(Math.random() * departments.length)
    const personIndex = Math.floor(
      Math.random() * persons.filter((p) => p.departmentCode === departments[departmentIndex].code).length,
    )
    const filteredPersons = persons.filter((p) => p.departmentCode === departments[departmentIndex].code)
    const personInChargeIndex = Math.floor(Math.random() * filteredPersons.length)

    const orderQuantity = Math.floor(Math.random() * 100) + 1
    const remainingQuantity = Math.floor(Math.random() * (orderQuantity + 1))

    const today = new Date()
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1)

    const expectedDate = new Date(deliveryDate)
    expectedDate.setDate(deliveryDate.getDate() - Math.floor(Math.random() * 5))

    sampleData.push({
      id: `AS${String(i + 2).padStart(4, "0")}`,
      expectedDate,
      vendorName: vendors[vendorIndex].name,
      productCode: products[productIndex].code,
      productName: products[productIndex].name,
      productSpecification: products[productIndex].specification,
      departmentName: departments[departmentIndex].name,
      personInChargeName: filteredPersons[personInChargeIndex]?.name || "田中 健太",
      poNumber: `P${String(1000000 + i).padStart(8, "0")} (${Math.floor(Math.random() * 5) + 1})`,
      deliveryDate,
      orderQuantity,
      remainingQuantity,
      unit: units[Math.floor(Math.random() * units.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    })
  }

  return sampleData
}

// ステータスに対応する背景色の設定
const getStatusColor = (status: string): string => {
  switch (status) {
    case "通常":
      return "bg-green-50"
    case "緊急":
      return "bg-red-50"
    case "遅延":
      return "bg-yellow-50"
    case "一部入荷済":
      return "bg-blue-50"
    default:
      return ""
  }
}

export default function ArrivalSchedulePage() {
  // 検索条件の状態
  const [warehouseFilter, setWarehouseFilter] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [vendorFilter, setVendorFilter] = useState<string>("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("")
  const [personFilter, setPersonFilter] = useState<string>("")
  const [productFilter, setProductFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // フィルタリングされた入荷予定データ
  const [filteredData, setFilteredData] = useState<ArrivalSchedule[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isFiltered, setIsFiltered] = useState<boolean>(false)

  // 検索実行
  const handleSearch = () => {
    setIsLoading(true)

    // 実際のAPIリクエストの代わりにサンプルデータを生成
    setTimeout(() => {
      const sampleData = generateSampleData()

      // 検索条件でフィルタリング
      const filtered = sampleData.filter((item) => {
        // 倉庫でフィルタリング
        const warehouseMatch = !warehouseFilter || warehouseFilter === "all"

        // 日付範囲でフィルタリング
        const dateMatch =
          (!dateRange.from || item.expectedDate >= dateRange.from) &&
          (!dateRange.to || item.expectedDate <= dateRange.to)

        // 仕入先でフィルタリング
        const vendorMatch =
          !vendorFilter ||
          vendorFilter === "all" ||
          vendors.find((v) => v.code === vendorFilter)?.name === item.vendorName

        // 部門でフィルタリング
        const departmentMatch =
          !departmentFilter ||
          departmentFilter === "all" ||
          departments.find((d) => d.code === departmentFilter)?.name === item.departmentName

        // 担当者でフィルタリング
        const personMatch =
          !personFilter ||
          personFilter === "all" ||
          persons.find((p) => p.code === personFilter)?.name === item.personInChargeName

        // 商品でフィルタリング
        const productMatch = !productFilter || productFilter === "all" || item.productCode === productFilter

        // 形態（ステータス）でフィルタリング
        const statusMatch = !statusFilter || statusFilter === "all" || item.status === statusFilter

        // 検索語句でフィルタリング
        const searchMatch =
          !searchTerm ||
          item.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.productName.toLowerCase().includes(searchTerm.toLowerCase())

        return (
          warehouseMatch &&
          dateMatch &&
          vendorMatch &&
          departmentMatch &&
          personMatch &&
          productMatch &&
          statusMatch &&
          searchMatch
        )
      })

      setFilteredData(filtered)
      setIsLoading(false)
      setIsFiltered(true)
    }, 500)
  }

  // フィルターリセット
  const resetFilters = () => {
    setWarehouseFilter("")
    setDateRange({ from: undefined, to: undefined })
    setVendorFilter("")
    setDepartmentFilter("")
    setPersonFilter("")
    setProductFilter("")
    setStatusFilter("")
    setSearchTerm("")
    setIsFiltered(false)
    setFilteredData([])
  }

  // 部門が選択された時に担当者リストをフィルタリング
  const filteredPersons =
    departmentFilter && departmentFilter !== "all"
      ? persons.filter((person) => person.departmentCode === departmentFilter)
      : persons

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">入荷予定照会</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            リセット
          </Button>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 倉庫 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Building className="h-4 w-4 mr-1" />
                倉庫
              </label>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="倉庫を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての倉庫</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.code} value={warehouse.code}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 入荷予定日 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                入荷予定日
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy/MM/dd", { locale: ja })} -{" "}
                          {format(dateRange.to, "yyyy/MM/dd", { locale: ja })}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy/MM/dd", { locale: ja })
                      )
                    ) : (
                      "日付を選択"
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

            {/* 仕入先 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Truck className="h-4 w-4 mr-1" />
                仕入先
              </label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="仕入先を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての仕入先</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.code} value={vendor.code}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 発注部門 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Building className="h-4 w-4 mr-1" />
                発注部門
              </label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="部門を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての部門</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.code} value={department.code}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 発注担当者 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-1" />
                発注担当者
              </label>
              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての担当者</SelectItem>
                  {filteredPersons.map((person) => (
                    <SelectItem key={person.code} value={person.code}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 商品 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-1" />
                商品
              </label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="商品を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての商品</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.code} value={product.code}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 形態（ステータス） */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                形態
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="形態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての形態</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center">
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 検索ボックス */}
            <div className="md:col-span-3 relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="発注番号、仕入先名、商品名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 検索ボタン */}
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    検索中...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    検索
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検索結果 */}
      <Card>
        <CardContent className="p-4">
          {isFiltered ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">検索結果: {filteredData.length}件</h2>
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">該当する入荷予定データがありません</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="border text-center bg-muted">
                          入荷予定日
                          <br />
                          形態
                        </TableHead>
                        <TableHead className="border text-center bg-muted">仕入先名</TableHead>
                        <TableHead className="border text-center bg-muted">商品コード</TableHead>
                        <TableHead className="border text-center bg-muted">商品名</TableHead>
                        <TableHead className="border text-center bg-muted">発注部門名</TableHead>
                        <TableHead className="border text-center bg-muted">発注担当者</TableHead>
                        <TableHead className="border text-center bg-muted">発注番号</TableHead>
                        <TableHead className="border text-center bg-muted">納期</TableHead>
                        <TableHead className="border text-center bg-muted">発注数量</TableHead>
                        <TableHead className="border text-center bg-muted">入荷残数量</TableHead>
                        <TableHead className="border text-center bg-muted">単位</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={item.id} className={cn(getStatusColor(item.status))}>
                          <TableCell className="border text-center">
                            {format(item.expectedDate, "yyyy/MM/dd")}
                            <br />
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-1",
                                item.status === "通常"
                                  ? "bg-green-100 text-green-800"
                                  : item.status === "緊急"
                                    ? "bg-red-100 text-red-800"
                                    : item.status === "遅延"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800",
                              )}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="border">{item.vendorName}</TableCell>
                          <TableCell className="border text-center">{item.productCode}</TableCell>
                          <TableCell className="border">{item.productName}</TableCell>
                          <TableCell className="border">{item.departmentName}</TableCell>
                          <TableCell className="border">{item.personInChargeName}</TableCell>
                          <TableCell className="border text-center">{item.poNumber}</TableCell>
                          <TableCell className="border text-center">
                            {format(item.deliveryDate, "yyyy/MM/dd")}
                          </TableCell>
                          <TableCell className="border text-right">{item.orderQuantity.toLocaleString()}</TableCell>
                          <TableCell className="border text-right">{item.remainingQuantity.toLocaleString()}</TableCell>
                          <TableCell className="border text-center">{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              検索条件を入力して「検索」ボタンをクリックしてください
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
