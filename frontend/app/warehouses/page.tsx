"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

// 倉庫区分の定義
const WAREHOUSE_TYPES = {
  "1": "通常倉庫",
  "2": "外部倉庫",
  "3": "仮想倉庫",
  "4": "返品倉庫",
  "5": "不良品倉庫",
}

// モックデータ
const mockWarehouses = [
  {
    id: "W001",
    code: "W001",
    name: "本社倉庫",
    shortName: "本社",
    kanaName: "ホンシャソウコ",
    address: "東京都千代田区丸の内1-1-1",
    phone: "03-1234-5678",
    fax: "03-1234-5679",
    type: "1",
  },
  {
    id: "W002",
    code: "W002",
    name: "大阪倉庫",
    shortName: "大阪",
    kanaName: "オオサカソウコ",
    address: "大阪府大阪市北区梅田2-2-2",
    phone: "06-1234-5678",
    fax: "06-1234-5679",
    type: "1",
  },
  {
    id: "W003",
    code: "W003",
    name: "福岡倉庫",
    shortName: "福岡",
    kanaName: "フクオカソウコ",
    address: "福岡県福岡市博多区博多駅前3-3-3",
    phone: "092-123-4567",
    fax: "092-123-4568",
    type: "2",
  },
  {
    id: "W004",
    code: "W004",
    name: "名古屋倉庫",
    shortName: "名古屋",
    kanaName: "ナゴヤソウコ",
    address: "愛知県名古屋市中区栄4-4-4",
    phone: "052-123-4567",
    fax: "052-123-4568",
    type: "1",
  },
  {
    id: "W005",
    code: "W005",
    name: "札幌倉庫",
    shortName: "札幌",
    kanaName: "サッポロソウコ",
    address: "北海道札幌市中央区北5条西5-5-5",
    phone: "011-123-4567",
    fax: "011-123-4568",
    type: "2",
  },
  {
    id: "W006",
    code: "W006",
    name: "返品保管倉庫",
    shortName: "返品",
    kanaName: "ヘンピンソウコ",
    address: "東京都江東区豊洲6-6-6",
    phone: "03-9876-5432",
    fax: "03-9876-5433",
    type: "4",
  },
  {
    id: "W007",
    code: "W007",
    name: "不良品倉庫",
    shortName: "不良品",
    kanaName: "フリョウヒンソウコ",
    address: "東京都江東区東雲7-7-7",
    phone: "03-9876-1234",
    fax: "03-9876-1235",
    type: "5",
  },
  {
    id: "W008",
    code: "W008",
    name: "仮想在庫倉庫",
    shortName: "仮想",
    kanaName: "カソウソウコ",
    address: "-",
    phone: "-",
    fax: "-",
    type: "3",
  },
]

export default function WarehousesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [warehouses, setWarehouses] = useState(mockWarehouses)

  // 検索機能
  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.kanaName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // 倉庫削除機能
  const handleDelete = (id: string) => {
    if (confirm("この倉庫を削除してもよろしいですか？")) {
      setWarehouses(warehouses.filter((warehouse) => warehouse.id !== id))
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">倉庫マスタ</h1>
        <Link href="/warehouses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>倉庫一覧</CardTitle>
          <CardDescription>システムに登録されている倉庫の一覧です。検索、編集、削除が可能です。</CardDescription>
          <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
            <Input
              placeholder="倉庫コード、倉庫名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>倉庫コード</TableHead>
                <TableHead>倉庫名</TableHead>
                <TableHead>略名</TableHead>
                <TableHead>倉庫区分</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWarehouses.length > 0 ? (
                filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">{warehouse.code}</TableCell>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>{warehouse.shortName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{WAREHOUSE_TYPES[warehouse.type as keyof typeof WAREHOUSE_TYPES]}</Badge>
                    </TableCell>
                    <TableCell>{warehouse.phone}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/warehouses/edit/${warehouse.id}`}>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(warehouse.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    検索条件に一致する倉庫がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
