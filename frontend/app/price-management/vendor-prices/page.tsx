"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, Eye, FileEdit, Plus, Save, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"

// 仕入先データのモック
const vendors = [
  { id: "1", code: "V001", name: "株式会社山田商事" },
  { id: "2", code: "V002", name: "鈴木物産株式会社" },
  { id: "3", code: "V003", name: "田中貿易株式会社" },
  { id: "4", code: "V004", name: "佐藤工業株式会社" },
  { id: "5", code: "V005", name: "伊藤産業株式会社" },
]

// 商品データのモック
const products = [
  { id: "1", code: "P001", name: "ボールペン（黒）" },
  { id: "2", code: "P002", name: "ノート（A4）" },
  { id: "3", code: "P003", name: "クリップ（小）" },
  { id: "4", code: "P004", name: "ホチキス" },
  { id: "5", code: "P005", name: "消しゴム" },
]

// 単価履歴セットの型定義
interface PriceHistorySet {
  id: string
  historyNumber: string
  name: string
  effectiveFrom: Date
  effectiveTo: Date | null
  createdAt: Date
  createdBy: string
  isActive: boolean
}

// 単価データの型定義
interface PriceData {
  id: string
  historySetId: string
  productId: string
  productCode: string
  productName: string
  hasVolumeDiscount: boolean
  fromQuantity: number | null
  toQuantity: number | null
  price: number
  isNew?: boolean
}

export default function VendorPricesPage() {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [vendorOpen, setVendorOpen] = useState(false)
  const [historySets, setHistorySets] = useState<PriceHistorySet[]>([])
  const [selectedHistorySet, setSelectedHistorySet] = useState<string | null>(null)
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [originalPriceData, setOriginalPriceData] = useState<PriceData[]>([])

  // 仕入先が選択されたときに履歴セットを取得する（モック）
  useEffect(() => {
    if (selectedVendor) {
      setIsHistoryLoading(true)
      setSelectedHistorySet(null)
      setPriceData([])
      setIsEditMode(false)

      // APIからデータを取得する代わりにモックデータを使用
      setTimeout(() => {
        const mockHistorySets: PriceHistorySet[] = [
          {
            id: "1",
            historyNumber: "H001",
            name: "2023年度標準単価",
            effectiveFrom: new Date(2023, 3, 1), // 2023年4月1日
            effectiveTo: new Date(2024, 2, 31), // 2024年3月31日
            createdAt: new Date(2023, 2, 15), // 2023年3月15日
            createdBy: "鈴木一郎",
            isActive: true,
          },
          {
            id: "2",
            historyNumber: "H002",
            name: "2023年夏季特別単価",
            effectiveFrom: new Date(2023, 6, 1), // 2023年7月1日
            effectiveTo: new Date(2023, 8, 30), // 2023年9月30日
            createdAt: new Date(2023, 5, 20), // 2023年6月20日
            createdBy: "田中花子",
            isActive: false,
          },
          {
            id: "3",
            historyNumber: "H003",
            name: "2024年度標準単価",
            effectiveFrom: new Date(2024, 3, 1), // 2024年4月1日
            effectiveTo: null, // 無期限
            createdAt: new Date(2024, 2, 10), // 2024年3月10日
            createdBy: "佐藤次郎",
            isActive: true,
          },
        ]
        setHistorySets(mockHistorySets)
        setIsHistoryLoading(false)
      }, 500)
    } else {
      setHistorySets([])
      setSelectedHistorySet(null)
      setPriceData([])
      setIsEditMode(false)
    }
  }, [selectedVendor])

  // 履歴セットが選択されたときに単価データを取得する（モック）
  useEffect(() => {
    if (selectedHistorySet) {
      setIsLoading(true)
      setIsEditMode(false)

      // APIからデータを取得する代わりにモックデータを使用
      setTimeout(() => {
        const mockPriceData: PriceData[] = [
          {
            id: "1",
            historySetId: selectedHistorySet,
            productId: "1",
            productCode: "P001",
            productName: "ボールペン（黒）",
            hasVolumeDiscount: true,
            fromQuantity: 1,
            toQuantity: 10,
            price: 100,
          },
          {
            id: "2",
            historySetId: selectedHistorySet,
            productId: "1",
            productCode: "P001",
            productName: "ボールペン（黒）",
            hasVolumeDiscount: true,
            fromQuantity: 11,
            toQuantity: 50,
            price: 90,
          },
          {
            id: "3",
            historySetId: selectedHistorySet,
            productId: "1",
            productCode: "P001",
            productName: "ボールペン（黒）",
            hasVolumeDiscount: true,
            fromQuantity: 51,
            toQuantity: null,
            price: 80,
          },
          {
            id: "4",
            historySetId: selectedHistorySet,
            productId: "2",
            productCode: "P002",
            productName: "ノート（A4）",
            hasVolumeDiscount: false,
            fromQuantity: null,
            toQuantity: null,
            price: 150,
          },
          {
            id: "5",
            historySetId: selectedHistorySet,
            productId: "3",
            productCode: "P003",
            productName: "クリップ（小）",
            hasVolumeDiscount: true,
            fromQuantity: 1,
            toQuantity: 5,
            price: 50,
          },
          {
            id: "6",
            historySetId: selectedHistorySet,
            productId: "3",
            productCode: "P003",
            productName: "クリップ（小）",
            hasVolumeDiscount: true,
            fromQuantity: 6,
            toQuantity: null,
            price: 45,
          },
        ]
        setPriceData(mockPriceData)
        setOriginalPriceData(JSON.parse(JSON.stringify(mockPriceData)))
        setIsLoading(false)
      }, 500)
    } else {
      setPriceData([])
      setOriginalPriceData([])
      setIsEditMode(false)
    }
  }, [selectedHistorySet])

  // 新規履歴セットの作成画面に遷移
  const createNewHistorySet = () => {
    // 実際の実装では新規作成画面に遷移する
    alert("新規履歴セット作成画面に遷移します")
  }

  // 履歴セットの編集モードを切り替え
  const toggleEditMode = () => {
    if (isEditMode) {
      // 編集モードから表示モードに戻る場合、変更を破棄するか確認
      if (JSON.stringify(priceData) !== JSON.stringify(originalPriceData)) {
        if (confirm("変更内容が保存されていません。変更を破棄しますか？")) {
          setPriceData(JSON.parse(JSON.stringify(originalPriceData)))
          setIsEditMode(false)
        }
      } else {
        setIsEditMode(false)
      }
    } else {
      setIsEditMode(true)
    }
  }

  // 単価データの更新
  const updatePriceData = (id: string, field: keyof PriceData, value: any) => {
    setPriceData((prevData) =>
      prevData.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // ボリュームディスカウントフラグがオフの場合、数量範囲をクリア
          if (field === "hasVolumeDiscount" && value === false) {
            updatedItem.fromQuantity = null
            updatedItem.toQuantity = null
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  // 新規行の追加
  const addNewRow = () => {
    // 新しい商品を選択するための行を追加
    const newProductSelector = {
      id: `new-${Date.now()}`,
      historySetId: selectedHistorySet || "",
      productId: "",
      productCode: "",
      productName: "",
      hasVolumeDiscount: false,
      fromQuantity: null,
      toQuantity: null,
      price: 0,
      isNew: true,
    }

    setPriceData([...priceData, newProductSelector])
  }

  // 行の削除
  const deleteRow = (id: string) => {
    setPriceData((prevData) => prevData.filter((item) => item.id !== id))
  }

  // 商品選択時の処理
  const handleProductSelect = (id: string, productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId)
    if (selectedProduct) {
      updatePriceData(id, "productId", productId)
      updatePriceData(id, "productCode", selectedProduct.code)
      updatePriceData(id, "productName", selectedProduct.name)

      // 新規行の場合、isNewフラグを外す
      setPriceData((prevData) => prevData.map((item) => (item.id === id ? { ...item, isNew: false } : item)))
    }
  }

  // データの保存
  const saveData = () => {
    // バリデーション: fromQuantity < toQuantity
    const hasInvalidRange = priceData.some(
      (item) =>
        item.hasVolumeDiscount &&
        item.fromQuantity !== null &&
        item.toQuantity !== null &&
        item.fromQuantity >= item.toQuantity,
    )

    if (hasInvalidRange) {
      alert("数量範囲が不正です。開始数量は終了数量より小さくしてください。")
      return
    }

    // 重複範囲のチェック
    const productGroups = priceData.reduce(
      (groups, item) => {
        if (!groups[item.productId]) {
          groups[item.productId] = []
        }
        groups[item.productId].push(item)
        return groups
      },
      {} as Record<string, PriceData[]>,
    )

    for (const productId in productGroups) {
      const items = productGroups[productId].filter((item) => item.hasVolumeDiscount)

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i]
          const b = items[j]

          // 範囲の重複チェック
          if (
            a.fromQuantity !== null &&
            b.fromQuantity !== null &&
            a.toQuantity !== null &&
            b.toQuantity !== null &&
            ((a.fromQuantity <= b.fromQuantity && b.fromQuantity <= a.toQuantity) ||
              (a.fromQuantity <= b.toQuantity && b.toQuantity <= a.toQuantity) ||
              (b.fromQuantity <= a.fromQuantity && a.toQuantity <= b.toQuantity))
          ) {
            alert(`商品「${a.productName}」の数量範囲が重複しています。`)
            return
          }
        }
      }
    }

    setIsLoading(true)
    // APIにデータを送信する処理（モック）
    setTimeout(() => {
      console.log("保存されたデータ:", priceData)
      setOriginalPriceData(JSON.parse(JSON.stringify(priceData)))
      setIsLoading(false)
      setIsEditMode(false)
      toast({
        title: "保存完了",
        description: "単価データが保存されました。",
      })
    }, 500)
  }

  // 変更のキャンセル
  const cancelEdit = () => {
    setPriceData(JSON.parse(JSON.stringify(originalPriceData)))
    setIsEditMode(false)
  }

  // 日付のフォーマット
  const formatDate = (date: Date | null) => {
    if (!date) return "無期限"
    return format(date, "yyyy年MM月dd日", { locale: ja })
  }

  // 商品選択用のコンポーネント
  const ProductSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [open, setOpen] = useState(false)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full">
            {value ? products.find((product) => product.id === value)?.code || "商品を選択" : "商品を選択"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput placeholder="商品を検索..." />
            <CommandList>
              <CommandEmpty>商品が見つかりません</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === product.id ? "opacity-100" : "opacity-0")} />
                    {product.code} - {product.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">仕入先別単価マスタ</h1>

      {/* 仕入先選択カード */}
      <Card>
        <CardHeader>
          <CardTitle>仕入先選択</CardTitle>
          <CardDescription>単価履歴を確認する仕入先を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={vendorOpen}
                className="w-full justify-between"
                disabled={isHistoryLoading || isEditMode}
              >
                {selectedVendor
                  ? vendors.find((vendor) => vendor.id === selectedVendor)?.name
                  : "仕入先を選択してください"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[400px]">
              <Command>
                <CommandInput placeholder="仕入先を検索..." />
                <CommandList>
                  <CommandEmpty>仕入先が見つかりません</CommandEmpty>
                  <CommandGroup>
                    {vendors.map((vendor) => (
                      <CommandItem
                        key={vendor.id}
                        value={vendor.id}
                        onSelect={(currentValue) => {
                          setSelectedVendor(currentValue === selectedVendor ? null : currentValue)
                          setVendorOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", selectedVendor === vendor.id ? "opacity-100" : "opacity-0")}
                        />
                        {vendor.code} - {vendor.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* 履歴セット一覧カード */}
      {selectedVendor && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>単価履歴一覧</CardTitle>
              <CardDescription>
                {vendors.find((v) => v.id === selectedVendor)?.name}の単価履歴セット一覧
              </CardDescription>
            </div>
            <Button onClick={createNewHistorySet} disabled={isEditMode}>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>履歴データを読み込み中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">履歴番号</TableHead>
                      <TableHead className="w-[200px]">単価設定名</TableHead>
                      <TableHead className="w-[200px]">有効期間</TableHead>
                      <TableHead className="w-[120px]">作成日</TableHead>
                      <TableHead className="w-[120px]">作成者</TableHead>
                      <TableHead className="w-[100px]">状態</TableHead>
                      <TableHead className="w-[150px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historySets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          履歴データがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      historySets.map((historySet) => (
                        <TableRow
                          key={historySet.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            selectedHistorySet === historySet.id ? "bg-muted" : "",
                            isEditMode ? "pointer-events-none opacity-50" : "",
                          )}
                          onClick={() => !isEditMode && setSelectedHistorySet(historySet.id)}
                        >
                          <TableCell>{historySet.historyNumber}</TableCell>
                          <TableCell>{historySet.name}</TableCell>
                          <TableCell>
                            {formatDate(historySet.effectiveFrom)} 〜 {formatDate(historySet.effectiveTo)}
                          </TableCell>
                          <TableCell>{format(historySet.createdAt, "yyyy/MM/dd")}</TableCell>
                          <TableCell>{historySet.createdBy}</TableCell>
                          <TableCell>
                            <Badge variant={historySet.isActive ? "default" : "secondary"}>
                              {historySet.isActive ? "有効" : "無効"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isEditMode}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedHistorySet(historySet.id)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                表示
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 単価データ詳細カード */}
      {selectedHistorySet && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>単価詳細</CardTitle>
              <CardDescription>{historySets.find((h) => h.id === selectedHistorySet)?.name} の単価詳細</CardDescription>
            </div>
            <div className="flex space-x-2">
              {isEditMode ? (
                <>
                  <Button onClick={saveData} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={isLoading}>
                    <X className="mr-2 h-4 w-4" />
                    キャンセル
                  </Button>
                </>
              ) : (
                <Button onClick={toggleEditMode} disabled={isLoading}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  編集
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p>単価データを読み込み中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">商品コード</TableHead>
                      <TableHead className="w-[200px]">商品名</TableHead>
                      <TableHead className="w-[150px]">ボリュームディスカウント</TableHead>
                      <TableHead className="w-[100px]">From数量</TableHead>
                      <TableHead className="w-[100px]">To数量</TableHead>
                      <TableHead className="w-[120px]">単価</TableHead>
                      {isEditMode && <TableHead className="w-[80px]">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isEditMode ? 7 : 6} className="text-center py-4">
                          単価データがありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      priceData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {isEditMode && item.isNew ? (
                              <ProductSelector
                                value={item.productId}
                                onChange={(value) => handleProductSelect(item.id, value)}
                              />
                            ) : (
                              item.productCode
                            )}
                          </TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-center">
                            {isEditMode ? (
                              <Checkbox
                                checked={item.hasVolumeDiscount}
                                onCheckedChange={(checked) => updatePriceData(item.id, "hasVolumeDiscount", !!checked)}
                                disabled={item.isNew && !item.productId}
                              />
                            ) : item.hasVolumeDiscount ? (
                              "あり"
                            ) : (
                              "なし"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={item.fromQuantity || ""}
                                onChange={(e) =>
                                  updatePriceData(
                                    item.id,
                                    "fromQuantity",
                                    e.target.value ? Number(e.target.value) : null,
                                  )
                                }
                                disabled={!item.hasVolumeDiscount || (item.isNew && !item.productId)}
                                min={1}
                              />
                            ) : item.fromQuantity !== null ? (
                              item.fromQuantity
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={item.toQuantity || ""}
                                onChange={(e) =>
                                  updatePriceData(item.id, "toQuantity", e.target.value ? Number(e.target.value) : null)
                                }
                                disabled={!item.hasVolumeDiscount || (item.isNew && !item.productId)}
                                min={item.fromQuantity || 1}
                              />
                            ) : item.toQuantity !== null ? (
                              item.toQuantity
                            ) : (
                              "無制限"
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => updatePriceData(item.id, "price", Number(e.target.value))}
                                disabled={item.isNew && !item.productId}
                                min={0}
                                step={0.01}
                              />
                            ) : (
                              `${item.price.toLocaleString()} 円`
                            )}
                          </TableCell>
                          {isEditMode && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteRow(item.id)}
                                disabled={item.isNew && !item.productId}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                    {isEditMode && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          <Button variant="outline" onClick={addNewRow} className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            新規行を追加
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
