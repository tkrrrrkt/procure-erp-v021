"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

// 在庫データのモックアップ
const inventoryData = [
  {
    id: "INV001",
    productCode: "P001",
    productName: "ノートパソコン",
    category: "電子機器",
    location: "東京倉庫",
    quantity: 120,
    minQuantity: 50,
    maxQuantity: 200,
    unitPrice: 85000,
    totalValue: 10200000,
    lastUpdated: "2025-03-25",
    status: "適正",
    lotInfo: [
      { lotNo: "L2025-001", quantity: 50, expiryDate: "2026-03-25" },
      { lotNo: "L2025-002", quantity: 70, expiryDate: "2026-04-15" },
    ],
  },
  {
    id: "INV002",
    productCode: "P002",
    productName: "デスクトップPC",
    category: "電子機器",
    location: "大阪倉庫",
    quantity: 45,
    minQuantity: 40,
    maxQuantity: 100,
    unitPrice: 95000,
    totalValue: 4275000,
    lastUpdated: "2025-03-20",
    status: "適正",
    lotInfo: [{ lotNo: "L2025-003", quantity: 45, expiryDate: "2026-03-20" }],
  },
  {
    id: "INV003",
    productCode: "P003",
    productName: "モニター 24インチ",
    category: "電子機器",
    location: "東京倉庫",
    quantity: 200,
    minQuantity: 100,
    maxQuantity: 150,
    unitPrice: 25000,
    totalValue: 5000000,
    lastUpdated: "2025-03-18",
    status: "過剰",
    lotInfo: [
      { lotNo: "L2025-004", quantity: 100, expiryDate: "2026-03-18" },
      { lotNo: "L2025-005", quantity: 100, expiryDate: "2026-03-25" },
    ],
  },
  {
    id: "INV004",
    productCode: "P004",
    productName: "キーボード",
    category: "周辺機器",
    location: "名古屋倉庫",
    quantity: 350,
    minQuantity: 200,
    maxQuantity: 400,
    unitPrice: 3500,
    totalValue: 1225000,
    lastUpdated: "2025-03-15",
    status: "適正",
    lotInfo: [
      { lotNo: "L2025-006", quantity: 150, expiryDate: "2026-03-15" },
      { lotNo: "L2025-007", quantity: 200, expiryDate: "2026-04-01" },
    ],
  },
  {
    id: "INV005",
    productCode: "P005",
    productName: "マウス",
    category: "周辺機器",
    location: "大阪倉庫",
    quantity: 15,
    minQuantity: 50,
    maxQuantity: 150,
    unitPrice: 2500,
    totalValue: 37500,
    lastUpdated: "2025-03-10",
    status: "不足",
    lotInfo: [{ lotNo: "L2025-008", quantity: 15, expiryDate: "2026-03-10" }],
  },
  {
    id: "INV006",
    productCode: "P006",
    productName: "プリンター",
    category: "周辺機器",
    location: "東京倉庫",
    quantity: 80,
    minQuantity: 30,
    maxQuantity: 100,
    unitPrice: 45000,
    totalValue: 3600000,
    lastUpdated: "2025-03-05",
    status: "適正",
    lotInfo: [
      { lotNo: "L2025-009", quantity: 30, expiryDate: "2026-03-05" },
      { lotNo: "L2025-010", quantity: 50, expiryDate: "2026-03-20" },
    ],
  },
  {
    id: "INV007",
    productCode: "P007",
    productName: "USBメモリ 32GB",
    category: "記憶媒体",
    location: "名古屋倉庫",
    quantity: 500,
    minQuantity: 300,
    maxQuantity: 600,
    unitPrice: 1800,
    totalValue: 900000,
    lastUpdated: "2025-03-01",
    status: "適正",
    lotInfo: [
      { lotNo: "L2025-011", quantity: 200, expiryDate: "2026-03-01" },
      { lotNo: "L2025-012", quantity: 300, expiryDate: "2026-03-15" },
    ],
  },
  {
    id: "INV008",
    productCode: "P008",
    productName: "外付けHDD 1TB",
    category: "記憶媒体",
    location: "東京倉庫",
    quantity: 25,
    minQuantity: 50,
    maxQuantity: 100,
    unitPrice: 12000,
    totalValue: 300000,
    lastUpdated: "2025-02-28",
    status: "不足",
    lotInfo: [{ lotNo: "L2025-013", quantity: 25, expiryDate: "2026-02-28" }],
  },
]

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // カテゴリと倉庫のユニークな値を取得
  const categories = Array.from(new Set(inventoryData.map((item) => item.category)))
  const locations = Array.from(new Set(inventoryData.map((item) => item.location)))

  // フィルタリングされたデータ
  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesLocation = locationFilter === "all" || item.location === locationFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus
  })

  // 在庫状態に応じたバッジの色を返す関数
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "適正":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            適正
          </Badge>
        )
      case "過剰":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            過剰
          </Badge>
        )
      case "不足":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            不足
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  // 行の展開/折りたたみを切り替える関数
  const toggleRowExpansion = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null)
    } else {
      setExpandedRow(id)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">在庫一覧</h1>
        <p className="text-muted-foreground">現在の在庫状況を確認し、在庫レベルを管理します。</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>検索条件</CardTitle>
          <CardDescription>商品コード、商品名、カテゴリなどで在庫を検索できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">商品コード/商品名</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="検索..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリ</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">保管場所</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="保管場所を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">在庫状態</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="在庫状態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="適正">適正</SelectItem>
                  <SelectItem value="過剰">過剰</SelectItem>
                  <SelectItem value="不足">不足</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            詳細フィルター
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            CSVエクスポート
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">{filteredData.length}件の在庫が見つかりました</div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <TableRow>
              <TableHead className="w-[100px]">商品コード</TableHead>
              <TableHead className="w-[200px]">商品名</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>保管場所</TableHead>
              <TableHead className="text-right">在庫数</TableHead>
              <TableHead className="text-right">単価</TableHead>
              <TableHead className="text-right">在庫金額</TableHead>
              <TableHead>在庫状態</TableHead>
              <TableHead className="text-right">詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  該当する在庫データがありません。
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <>
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productCode}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">¥{item.totalValue.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => toggleRowExpansion(item.id)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">詳細を表示</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>詳細を表示</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                  {expandedRow === item.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/50 p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 font-medium">ロット情報</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ロット番号</TableHead>
                                  <TableHead className="text-right">数量</TableHead>
                                  <TableHead>有効期限</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {item.lotInfo.map((lot) => (
                                  <TableRow key={lot.lotNo}>
                                    <TableCell>{lot.lotNo}</TableCell>
                                    <TableCell className="text-right">{lot.quantity}</TableCell>
                                    <TableCell>{lot.expiryDate}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <h4 className="mb-2 font-medium">在庫管理情報</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">最小在庫数:</span>
                                  <span>{item.minQuantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">最大在庫数:</span>
                                  <span>{item.maxQuantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">最終更新日:</span>
                                  <span>{item.lastUpdated}</span>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <h4 className="mb-2 font-medium">在庫推移グラフ</h4>
                              <div className="h-32 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                在庫推移グラフがここに表示されます
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
