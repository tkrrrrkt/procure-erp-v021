"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Save, X, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// 倉庫データのモック
const warehouseData = [
  { id: "WH001", name: "東京倉庫" },
  { id: "WH002", name: "大阪倉庫" },
  { id: "WH003", name: "名古屋倉庫" },
  { id: "WH004", name: "福岡倉庫" },
  { id: "WH005", name: "札幌倉庫" },
]

// 商品データのモック
const productData = [
  { id: "P001", name: "ノートパソコン 15インチ", category: "電子機器" },
  { id: "P002", name: "デスクトップPC", category: "電子機器" },
  { id: "P003", name: "モニター 24インチ", category: "電子機器" },
  { id: "P004", name: "キーボード", category: "周辺機器" },
  { id: "P005", name: "マウス", category: "周辺機器" },
  { id: "P006", name: "プリンター", category: "周辺機器" },
  { id: "P007", name: "USBケーブル", category: "ケーブル" },
  { id: "P008", name: "HDMIケーブル", category: "ケーブル" },
  { id: "P009", name: "LANケーブル", category: "ケーブル" },
  { id: "P010", name: "スマートフォン", category: "電子機器" },
]

// 発注点データのモック
const generateReorderPointData = (warehouseId) => {
  // 倉庫ごとに異なるデータを生成
  const productCount = Math.floor(Math.random() * 5) + 5 // 5〜9個の商品
  const selectedProducts = [...productData].sort(() => 0.5 - Math.random()).slice(0, productCount)

  return selectedProducts.map((product) => ({
    id: `${warehouseId}-${product.id}`,
    productId: product.id,
    productName: product.name,
    physicalStock: Math.floor(Math.random() * 100),
    availableStock: Math.floor(Math.random() * 80),
    reorderPoint: Math.floor(Math.random() * 30) + 10,
    safetyStock: Math.floor(Math.random() * 20) + 5,
  }))
}

// 商品選択用のデータ（新規行追加用）
const availableProducts = productData.map((product) => ({
  value: product.id,
  label: `${product.id} - ${product.name}`,
}))

export default function ReorderPointPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [reorderPointData, setReorderPointData] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [warehouseName, setWarehouseName] = useState("")

  // 倉庫選択時のデータ取得
  const handleSearch = () => {
    if (!selectedWarehouse) return

    setIsLoading(true)

    // 実際のアプリケーションではAPIからデータを取得
    setTimeout(() => {
      const data = generateReorderPointData(selectedWarehouse)
      setReorderPointData(data)
      setEditedData(JSON.parse(JSON.stringify(data)))

      const warehouse = warehouseData.find((w) => w.id === selectedWarehouse)
      setWarehouseName(warehouse ? warehouse.name : "")

      setIsLoading(false)
    }, 500)
  }

  // 編集モードの切り替え
  const toggleEditMode = () => {
    if (isEditing) {
      // 編集モードを終了する場合は、編集データを破棄
      setEditedData(JSON.parse(JSON.stringify(reorderPointData)))
    }
    setIsEditing(!isEditing)
  }

  // 変更の保存
  const saveChanges = () => {
    setReorderPointData(JSON.parse(JSON.stringify(editedData)))
    setIsEditing(false)

    // 実際のアプリケーションではAPIにデータを送信
    console.log("保存されたデータ:", editedData)
  }

  // 発注点の編集
  const handleReorderPointChange = (id, value) => {
    const numValue = Number.parseInt(value, 10) || 0
    setEditedData((prev) => prev.map((item) => (item.id === id ? { ...item, reorderPoint: numValue } : item)))
  }

  // 安全在庫の編集
  const handleSafetyStockChange = (id, value) => {
    const numValue = Number.parseInt(value, 10) || 0
    setEditedData((prev) => prev.map((item) => (item.id === id ? { ...item, safetyStock: numValue } : item)))
  }

  // 新規行の追加
  const addNewRow = () => {
    // すでに追加されている商品IDを取得
    const existingProductIds = editedData.map((item) => item.productId)

    // まだ追加されていない商品を取得
    const availableProductsForAdd = productData.filter((product) => !existingProductIds.includes(product.id))

    if (availableProductsForAdd.length === 0) {
      alert("追加できる商品がありません。")
      return
    }

    // 最初の利用可能な商品を追加
    const productToAdd = availableProductsForAdd[0]

    const newRow = {
      id: `${selectedWarehouse}-${productToAdd.id}-new-${Date.now()}`,
      productId: productToAdd.id,
      productName: productToAdd.name,
      physicalStock: 0,
      availableStock: 0,
      reorderPoint: 10,
      safetyStock: 5,
    }

    setEditedData((prev) => [...prev, newRow])
  }

  // 行の削除
  const deleteRow = (id) => {
    setEditedData((prev) => prev.filter((item) => item.id !== id))
  }

  // 商品の選択変更（新規追加行用）
  const handleProductChange = (id, productId) => {
    const product = productData.find((p) => p.id === productId)
    if (!product) return

    setEditedData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: product.id,
              productName: product.name,
            }
          : item,
      ),
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">発注点管理</h1>

      {/* 検索条件カード */}
      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
          <CardDescription>倉庫を選択して発注点設定を検索します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">倉庫</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="倉庫を選択" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseData.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSearch} disabled={!selectedWarehouse || isLoading}>
            {isLoading ? "検索中..." : "検索"}
            {!isLoading && <Search className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>

      {/* 発注点一覧カード */}
      {reorderPointData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>発注点設定一覧</CardTitle>
              <CardDescription>
                {warehouseName}の発注点設定 ({reorderPointData.length}件)
              </CardDescription>
            </div>
            <Button variant={isEditing ? "destructive" : "default"} onClick={toggleEditMode}>
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  キャンセル
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  編集
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品コード</TableHead>
                    <TableHead>商品名</TableHead>
                    <TableHead className="text-right">実在庫数量</TableHead>
                    <TableHead className="text-right">有効在庫数量</TableHead>
                    <TableHead className="text-right">発注点</TableHead>
                    <TableHead className="text-right">安全在庫数</TableHead>
                    {isEditing && <TableHead className="text-center">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isEditing ? editedData : reorderPointData).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">
                        {item.physicalStock}
                        {item.physicalStock < item.reorderPoint && (
                          <Badge variant="destructive" className="ml-2">
                            発注点以下
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.availableStock}</TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.reorderPoint}
                            onChange={(e) => handleReorderPointChange(item.id, e.target.value)}
                            className="w-24 text-right"
                            min="0"
                          />
                        ) : (
                          item.reorderPoint
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.safetyStock}
                            onChange={(e) => handleSafetyStockChange(item.id, e.target.value)}
                            className="w-24 text-right"
                            min="0"
                          />
                        ) : (
                          item.safetyStock
                        )}
                      </TableCell>
                      {isEditing && (
                        <TableCell className="text-center">
                          <Button variant="destructive" size="sm" onClick={() => deleteRow(item.id)}>
                            削除
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {isEditing && (
                    <TableRow>
                      <TableCell colSpan={isEditing ? 7 : 6} className="text-center">
                        <Button variant="outline" size="sm" onClick={addNewRow} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          新規行を追加
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={toggleEditMode}>
                キャンセル
              </Button>
              <Button onClick={saveChanges}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}
