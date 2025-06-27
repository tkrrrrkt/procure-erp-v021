"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Download, Plus } from "lucide-react"
import Link from "next/link"

// サンプルデータ
const products = [
  {
    id: "P001",
    code: "10001",
    name: "ノートパソコン 15インチ",
    kanaName: "ノートパソコン15インチ",
    type: "通常商品",
    manufacturer: "テックCo.",
    standardPrice: 120000,
    valuationMethod: "月次総平均法",
    salesStatus: "販売中",
  },
  {
    id: "P002",
    code: "10002",
    name: "デスクトップPC ハイスペック",
    kanaName: "デスクトップピーシーハイスペック",
    type: "通常商品",
    manufacturer: "テックCo.",
    standardPrice: 150000,
    valuationMethod: "標準原価法",
    salesStatus: "販売中",
  },
  {
    id: "P003",
    code: "10003",
    name: "ワイヤレスマウス",
    kanaName: "ワイヤレスマウス",
    type: "通常商品",
    manufacturer: "ペリフェラルズInc.",
    standardPrice: 3500,
    valuationMethod: "先入先出法",
    salesStatus: "販売中",
  },
  {
    id: "P004",
    code: "10004",
    name: "4Kモニター 27インチ",
    kanaName: "ヨンケーモニター27インチ",
    type: "通常商品",
    manufacturer: "ディスプレイTech",
    standardPrice: 45000,
    valuationMethod: "月次総平均法",
    salesStatus: "販売中",
  },
  {
    id: "P005",
    code: "10005",
    name: "メカニカルキーボード",
    kanaName: "メカニカルキーボード",
    type: "通常商品",
    manufacturer: "ペリフェラルズInc.",
    standardPrice: 12000,
    valuationMethod: "標準原価法",
    salesStatus: "販売中",
  },
  {
    id: "P006",
    code: "20001",
    name: "旧モデルタブレット",
    kanaName: "キュウモデルタブレット",
    type: "通常商品",
    manufacturer: "テックCo.",
    standardPrice: 35000,
    valuationMethod: "月次総平均法",
    salesStatus: "廃止",
  },
  {
    id: "P007",
    code: "30001",
    name: "在庫管理用タグ",
    kanaName: "ザイコカンリヨウタグ",
    type: "制御用",
    manufacturer: "システムCo.",
    standardPrice: 0,
    valuationMethod: "標準原価法",
    salesStatus: "販売中",
  },
]

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [salesStatusFilter, setSalesStatusFilter] = useState("all")
  const [valuationMethodFilter, setValuationMethodFilter] = useState("all")

  // フィルタリングされた商品リスト
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.kanaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || product.type === typeFilter
    const matchesSalesStatus = salesStatusFilter === "all" || product.salesStatus === salesStatusFilter
    const matchesValuationMethod = valuationMethodFilter === "all" || product.valuationMethod === valuationMethodFilter

    return matchesSearch && matchesType && matchesSalesStatus && matchesValuationMethod
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">商品一覧</h1>
        <Link href="/products/new">
          <Button className="flex items-center gap-1">
            <Plus size={16} />
            新規登録
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="商品コード、商品名で検索..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="商品種別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての種別</SelectItem>
                <SelectItem value="通常商品">通常商品</SelectItem>
                <SelectItem value="廃止">廃止</SelectItem>
                <SelectItem value="制御用">制御用</SelectItem>
                <SelectItem value="製造原価項目">製造原価項目</SelectItem>
                <SelectItem value="ファントム">ファントム</SelectItem>
              </SelectContent>
            </Select>

            <Select value={salesStatusFilter} onValueChange={setSalesStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="販売状況" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状況</SelectItem>
                <SelectItem value="販売中">販売中</SelectItem>
                <SelectItem value="廃止">廃止</SelectItem>
              </SelectContent>
            </Select>

            <Select value={valuationMethodFilter} onValueChange={setValuationMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="在庫評価法" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての評価法</SelectItem>
                <SelectItem value="標準原価法">標準原価法</SelectItem>
                <SelectItem value="先入先出法">先入先出法</SelectItem>
                <SelectItem value="移動平均法">移動平均法</SelectItem>
                <SelectItem value="月次総平均法">月次総平均法</SelectItem>
                <SelectItem value="受終仕入原価法">受終仕入原価法</SelectItem>
                <SelectItem value="先価逆順原価法">先価逆順原価法</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => {
                setSearchTerm("")
                setTypeFilter("all")
                setSalesStatusFilter("all")
                setValuationMethodFilter("all")
              }}
            >
              <Filter size={16} />
              フィルターをクリア
            </Button>

            <Button variant="outline" className="flex items-center gap-1">
              <Download size={16} />
              エクスポート
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-teal-50 to-emerald-100">
              <TableRow>
                <TableHead className="w-[100px]">商品コード</TableHead>
                <TableHead>商品名</TableHead>
                <TableHead>商品カナ名</TableHead>
                <TableHead>商品種別</TableHead>
                <TableHead>メーカー</TableHead>
                <TableHead className="text-right">標準単価</TableHead>
                <TableHead>在庫評価法</TableHead>
                <TableHead>販売状況</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.kanaName}</TableCell>
                    <TableCell>{product.type}</TableCell>
                    <TableCell>{product.manufacturer}</TableCell>
                    <TableCell className="text-right">{product.standardPrice.toLocaleString()} 円</TableCell>
                    <TableCell>{product.valuationMethod}</TableCell>
                    <TableCell>
                      <Badge variant={product.salesStatus === "販売中" ? "success" : "destructive"}>
                        {product.salesStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    該当する商品がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          表示: {filteredProducts.length} / {products.length} 件
        </div>
      </div>
    </div>
  )
}
