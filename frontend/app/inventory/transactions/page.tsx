"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, ArrowDown, ArrowUp } from "lucide-react"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"

// 在庫受払データのモックアップ
const transactionData = [
  {
    id: "TRX001",
    date: "2025-03-25",
    productCode: "P001",
    productName: "ノートパソコン",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 50,
    unitPrice: 85000,
    totalAmount: 4250000,
    location: "東京倉庫",
    documentNo: "PO-2025-0125",
    lotNo: "L2025-001",
  },
  {
    id: "TRX002",
    date: "2025-03-24",
    productCode: "P003",
    productName: "モニター 24インチ",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 100,
    unitPrice: 25000,
    totalAmount: 2500000,
    location: "東京倉庫",
    documentNo: "PO-2025-0126",
    lotNo: "L2025-004",
  },
  {
    id: "TRX003",
    date: "2025-03-23",
    productCode: "P001",
    productName: "ノートパソコン",
    transactionType: "出庫",
    reason: "販売",
    quantity: 10,
    unitPrice: 85000,
    totalAmount: 850000,
    location: "東京倉庫",
    documentNo: "SO-2025-0089",
    lotNo: "L2025-001",
  },
  {
    id: "TRX004",
    date: "2025-03-22",
    productCode: "P002",
    productName: "デスクトップPC",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 45,
    unitPrice: 95000,
    totalAmount: 4275000,
    location: "大阪倉庫",
    documentNo: "PO-2025-0127",
    lotNo: "L2025-003",
  },
  {
    id: "TRX005",
    date: "2025-03-21",
    productCode: "P004",
    productName: "キーボード",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 150,
    unitPrice: 3500,
    totalAmount: 525000,
    location: "名古屋倉庫",
    documentNo: "PO-2025-0128",
    lotNo: "L2025-006",
  },
  {
    id: "TRX006",
    date: "2025-03-20",
    productCode: "P003",
    productName: "モニター 24インチ",
    transactionType: "出庫",
    reason: "販売",
    quantity: 25,
    unitPrice: 25000,
    totalAmount: 625000,
    location: "東京倉庫",
    documentNo: "SO-2025-0090",
    lotNo: "L2025-004",
  },
  {
    id: "TRX007",
    date: "2025-03-19",
    productCode: "P005",
    productName: "マウス",
    transactionType: "出庫",
    reason: "販売",
    quantity: 35,
    unitPrice: 2500,
    totalAmount: 87500,
    location: "大阪倉庫",
    documentNo: "SO-2025-0091",
    lotNo: "L2025-008",
  },
  {
    id: "TRX008",
    date: "2025-03-18",
    productCode: "P006",
    productName: "プリンター",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 30,
    unitPrice: 45000,
    totalAmount: 1350000,
    location: "東京倉庫",
    documentNo: "PO-2025-0129",
    lotNo: "L2025-009",
  },
  {
    id: "TRX009",
    date: "2025-03-17",
    productCode: "P007",
    productName: "USBメモリ 32GB",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 200,
    unitPrice: 1800,
    totalAmount: 360000,
    location: "名古屋倉庫",
    documentNo: "PO-2025-0130",
    lotNo: "L2025-011",
  },
  {
    id: "TRX010",
    date: "2025-03-16",
    productCode: "P001",
    productName: "ノートパソコン",
    transactionType: "入庫",
    reason: "返品",
    quantity: 2,
    unitPrice: 85000,
    totalAmount: 170000,
    location: "東京倉庫",
    documentNo: "RMA-2025-0015",
    lotNo: "L2025-001",
  },
  {
    id: "TRX011",
    date: "2025-03-15",
    productCode: "P004",
    productName: "キーボード",
    transactionType: "入庫",
    reason: "仕入",
    quantity: 200,
    unitPrice: 3500,
    totalAmount: 700000,
    location: "名古屋倉庫",
    documentNo: "PO-2025-0131",
    lotNo: "L2025-007",
  },
  {
    id: "TRX012",
    date: "2025-03-14",
    productCode: "P008",
    productName: "外付けHDD 1TB",
    transactionType: "出庫",
    reason: "社内使用",
    quantity: 5,
    unitPrice: 12000,
    totalAmount: 60000,
    location: "東京倉庫",
    documentNo: "INT-2025-0022",
    lotNo: "L2025-013",
  },
]

export default function InventoryTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [productFilter, setProductFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [reasonFilter, setReasonFilter] = useState("all")
  const [date, setDate] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  // 製品、取引タイプ、理由のユニークな値を取得
  const products = Array.from(new Set(transactionData.map((item) => item.productName)))
  const transactionTypes = Array.from(new Set(transactionData.map((item) => item.transactionType)))
  const reasons = Array.from(new Set(transactionData.map((item) => item.reason)))

  // フィルタリングされたデータ
  const filteredData = transactionData.filter((item) => {
    const matchesSearch =
      item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentNo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProduct = productFilter === "all" || item.productName === productFilter
    const matchesType = typeFilter === "all" || item.transactionType === typeFilter
    const matchesReason = reasonFilter === "all" || item.reason === reasonFilter

    // 日付範囲のフィルタリング
    const itemDate = new Date(item.date)
    const fromDate = date.from ? new Date(date.from) : null
    const toDate = date.to ? new Date(date.to) : null

    const isAfterFromDate = fromDate ? itemDate >= fromDate : true
    const isBeforeToDate = toDate ? itemDate <= toDate : true

    return matchesSearch && matchesProduct && matchesType && matchesReason && isAfterFromDate && isBeforeToDate
  })

  // 取引タイプに応じたバッジの色を返す関数
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "入庫":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <ArrowDown className="mr-1 h-3 w-3" />
            入庫
          </Badge>
        )
      case "出庫":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <ArrowUp className="mr-1 h-3 w-3" />
            出庫
          </Badge>
        )
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">在庫受払照会</h1>
        <p className="text-muted-foreground">在庫の入出庫履歴を確認し、在庫の動きを追跡します。</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>検索条件</CardTitle>
          <CardDescription>期間、商品、取引タイプなどで在庫の受払を検索できます。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date-range">期間</Label>
              <DatePickerWithRange date={date} setDate={setDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">商品コード/商品名/伝票番号</Label>
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
              <Label htmlFor="product">商品</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="商品を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">取引タイプ</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">理由</Label>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="理由を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {reasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
        <div className="text-sm text-muted-foreground">{filteredData.length}件の取引が見つかりました</div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>取引タイプ</TableHead>
              <TableHead>理由</TableHead>
              <TableHead>商品コード</TableHead>
              <TableHead>商品名</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead className="text-right">単価</TableHead>
              <TableHead className="text-right">金額</TableHead>
              <TableHead>保管場所</TableHead>
              <TableHead>伝票番号</TableHead>
              <TableHead>ロット番号</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  該当する取引データがありません。
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{getTransactionTypeBadge(item.transactionType)}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell className="font-medium">{item.productCode}</TableCell>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right">¥{item.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.documentNo}</TableCell>
                  <TableCell>{item.lotNo}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>在庫受払集計</CardTitle>
          <CardDescription>期間内の入出庫の集計情報</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">入庫合計</h3>
              <p className="text-2xl font-bold">
                {filteredData
                  .filter((item) => item.transactionType === "入庫")
                  .reduce((sum, item) => sum + item.quantity, 0)
                  .toLocaleString()}
                <span className="ml-1 text-sm font-normal text-muted-foreground">個</span>
              </p>
              <p className="text-sm text-muted-foreground">
                ¥
                {filteredData
                  .filter((item) => item.transactionType === "入庫")
                  .reduce((sum, item) => sum + item.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">出庫合計</h3>
              <p className="text-2xl font-bold">
                {filteredData
                  .filter((item) => item.transactionType === "出庫")
                  .reduce((sum, item) => sum + item.quantity, 0)
                  .toLocaleString()}
                <span className="ml-1 text-sm font-normal text-muted-foreground">個</span>
              </p>
              <p className="text-sm text-muted-foreground">
                ¥
                {filteredData
                  .filter((item) => item.transactionType === "出庫")
                  .reduce((sum, item) => sum + item.totalAmount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">純増減</h3>
              <p className="text-2xl font-bold">
                {(
                  filteredData
                    .filter((item) => item.transactionType === "入庫")
                    .reduce((sum, item) => sum + item.quantity, 0) -
                  filteredData
                    .filter((item) => item.transactionType === "出庫")
                    .reduce((sum, item) => sum + item.quantity, 0)
                ).toLocaleString()}
                <span className="ml-1 text-sm font-normal text-muted-foreground">個</span>
              </p>
              <p className="text-sm text-muted-foreground">
                ¥
                {(
                  filteredData
                    .filter((item) => item.transactionType === "入庫")
                    .reduce((sum, item) => sum + item.totalAmount, 0) -
                  filteredData
                    .filter((item) => item.transactionType === "出庫")
                    .reduce((sum, item) => sum + item.totalAmount, 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
