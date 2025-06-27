"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Check, ChevronsUpDown, Filter, Loader2, PackageCheck, Search } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

// モックデータ
const departments = [
  { value: "all", label: "すべて" },
  { value: "purchase", label: "購買部" },
  { value: "production", label: "生産部" },
  { value: "logistics", label: "物流部" },
  { value: "sales", label: "営業部" },
]

const employees = [
  { value: "all", label: "すべて" },
  { value: "tanaka", label: "田中太郎" },
  { value: "suzuki", label: "鈴木一郎" },
  { value: "yamada", label: "山田花子" },
  { value: "sato", label: "佐藤次郎" },
]

const warehouses = [
  { value: "main", label: "本社倉庫" },
  { value: "east", label: "東日本倉庫" },
  { value: "west", label: "西日本倉庫" },
  { value: "central", label: "中央物流センター" },
]

const vendors = [
  { value: "all", label: "すべて" },
  { value: "vendor1", label: "株式会社山田製作所" },
  { value: "vendor2", label: "東京部品株式会社" },
  { value: "vendor3", label: "大阪金属工業" },
  { value: "vendor4", label: "名古屋電子" },
]

// 発注データのモック
const purchaseOrders = [
  {
    id: "PO-2023-0001",
    dueDate: "2023/04/15",
    department: "購買部",
    employee: "田中太郎",
    items: [
      { id: 1, code: "ITEM-001", name: "アルミ板 A4サイズ 厚さ1mm", quantity: 100, unit: "枚" },
      { id: 2, code: "ITEM-002", name: "ステンレスボルト M5x10mm", quantity: 500, unit: "個" },
    ],
    vendor: "株式会社山田製作所",
  },
  {
    id: "PO-2023-0002",
    dueDate: "2023/04/20",
    department: "生産部",
    employee: "鈴木一郎",
    items: [
      { id: 3, code: "ITEM-003", name: "電子基板 Type-A", quantity: 50, unit: "枚" },
      { id: 4, code: "ITEM-004", name: "LED 5mm 赤色", quantity: 1000, unit: "個" },
    ],
    vendor: "東京部品株式会社",
  },
  {
    id: "PO-2023-0003",
    dueDate: "2023/04/25",
    department: "物流部",
    employee: "山田花子",
    items: [
      { id: 5, code: "ITEM-005", name: "梱包材 60x40x30cm", quantity: 200, unit: "個" },
      { id: 6, code: "ITEM-006", name: "緩衝材 ロール 幅50cm", quantity: 10, unit: "巻" },
    ],
    vendor: "大阪金属工業",
  },
  {
    id: "PO-2023-0004",
    dueDate: "2023/05/05",
    department: "営業部",
    employee: "佐藤次郎",
    items: [
      { id: 7, code: "ITEM-007", name: "カタログ A4サイズ 32ページ", quantity: 500, unit: "冊" },
      { id: 8, code: "ITEM-008", name: "サンプルキット Type-B", quantity: 50, unit: "セット" },
    ],
    vendor: "名古屋電子",
  },
]

export default function BulkArrivalPage() {
  // 状態管理
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("")
  const [arrivalDate, setArrivalDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [dueDateRange, setDueDateRange] = useState<DateRange | undefined>()
  const [orderDateRange, setOrderDateRange] = useState<DateRange | undefined>()
  const [poNumberFrom, setPoNumberFrom] = useState<string>("")
  const [poNumberTo, setPoNumberTo] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedPurchaser, setSelectedPurchaser] = useState<string>("all")
  const [selectedVendor, setSelectedVendor] = useState<string>("all")
  const [openDepartment, setOpenDepartment] = useState(false)
  const [openPurchaser, setOpenPurchaser] = useState(false)
  const [openVendor, setOpenVendor] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  // 全選択/解除の処理
  const handleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)

    const newSelectedItems: Record<string, boolean> = {}
    purchaseOrders.forEach((po) => {
      po.items.forEach((item) => {
        newSelectedItems[`${po.id}-${item.id}`] = newSelectAll
      })
    })
    setSelectedItems(newSelectedItems)
  }

  // 個別選択の処理
  const handleSelectItem = (poId: string, itemId: number) => {
    const key = `${poId}-${itemId}`
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))

    // 全選択状態の更新
    const allSelected = purchaseOrders.every((po) =>
      po.items.every((item) => selectedItems[`${po.id}-${item.id}`] ?? false),
    )
    setSelectAll(allSelected)
  }

  // 一括入荷処理の実行
  const handleBulkArrival = () => {
    // 選択されたアイテムの数を確認
    const selectedCount = Object.values(selectedItems).filter(Boolean).length

    if (selectedCount === 0) {
      toast({
        title: "エラー",
        description: "入荷処理する商品を選択してください。",
        variant: "destructive",
      })
      return
    }

    if (!selectedEmployee) {
      toast({
        title: "エラー",
        description: "担当者を選択してください。",
        variant: "destructive",
      })
      return
    }

    if (!selectedWarehouse) {
      toast({
        title: "エラー",
        description: "倉庫を選択してください。",
        variant: "destructive",
      })
      return
    }

    // 処理中フラグをセット
    setIsProcessing(true)

    // 実際のAPIコールはここで行う
    // モックのため、タイマーで成功メッセージを表示
    setTimeout(() => {
      setIsProcessing(false)
      toast({
        title: "入荷処理完了",
        description: `${selectedCount}件の商品を入荷処理しました。`,
      })

      // 選択をクリア
      setSelectedItems({})
      setSelectAll(false)
    }, 1500)
  }

  // 検索条件のリセット
  const resetFilters = () => {
    setDueDateRange(undefined)
    setOrderDateRange(undefined)
    setPoNumberFrom("")
    setPoNumberTo("")
    setSelectedDepartment("all")
    setSelectedPurchaser("all")
    setSelectedVendor("all")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">一括入荷処理</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>入荷情報</CardTitle>
          <CardDescription>入荷処理に必要な基本情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employee">担当者</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.value !== "all")
                    .map((employee) => (
                      <SelectItem key={employee.value} value={employee.value}>
                        {employee.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalDate">入荷日</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">倉庫</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="倉庫を選択" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.value} value={warehouse.value}>
                      {warehouse.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
          <CardDescription>入荷処理する発注データを検索します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>入荷予定日</Label>
              <DatePickerWithRange date={dueDateRange} setDate={setDueDateRange} />
            </div>

            <div className="space-y-2">
              <Label>発注日</Label>
              <DatePickerWithRange date={orderDateRange} setDate={setOrderDateRange} />
            </div>

            <div className="space-y-2">
              <Label>発注番号</Label>
              <div className="flex space-x-2">
                <Input placeholder="開始" value={poNumberFrom} onChange={(e) => setPoNumberFrom(e.target.value)} />
                <span className="flex items-center">～</span>
                <Input placeholder="終了" value={poNumberTo} onChange={(e) => setPoNumberTo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>発注部門</Label>
              <Popover open={openDepartment} onOpenChange={setOpenDepartment}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDepartment}
                    className="w-full justify-between"
                  >
                    {selectedDepartment
                      ? departments.find((dept) => dept.value === selectedDepartment)?.label
                      : "部門を選択"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="部門を検索..." />
                    <CommandList>
                      <CommandEmpty>該当する部門がありません</CommandEmpty>
                      <CommandGroup>
                        {departments.map((dept) => (
                          <CommandItem
                            key={dept.value}
                            value={dept.value}
                            onSelect={(currentValue) => {
                              setSelectedDepartment(currentValue)
                              setOpenDepartment(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDepartment === dept.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {dept.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>発注担当者</Label>
              <Popover open={openPurchaser} onOpenChange={setOpenPurchaser}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPurchaser}
                    className="w-full justify-between"
                  >
                    {selectedPurchaser
                      ? employees.find((emp) => emp.value === selectedPurchaser)?.label
                      : "担当者を選択"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="担当者を検索..." />
                    <CommandList>
                      <CommandEmpty>該当する担当者がありません</CommandEmpty>
                      <CommandGroup>
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.value}
                            value={emp.value}
                            onSelect={(currentValue) => {
                              setSelectedPurchaser(currentValue)
                              setOpenPurchaser(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPurchaser === emp.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {emp.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>仕入先</Label>
              <Popover open={openVendor} onOpenChange={setOpenVendor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openVendor}
                    className="w-full justify-between"
                  >
                    {selectedVendor ? vendors.find((vendor) => vendor.value === selectedVendor)?.label : "仕入先を選択"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="仕入先を検索..." />
                    <CommandList>
                      <CommandEmpty>該当する仕入先がありません</CommandEmpty>
                      <CommandGroup>
                        {vendors.map((vendor) => (
                          <CommandItem
                            key={vendor.value}
                            value={vendor.value}
                            onSelect={(currentValue) => {
                              setSelectedVendor(currentValue)
                              setOpenVendor(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedVendor === vendor.value ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {vendor.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={resetFilters}>
              <Filter className="mr-2 h-4 w-4" />
              条件クリア
            </Button>
            <Button onClick={() => {}} className="bg-blue-600 hover:bg-blue-700">
              <Search className="mr-2 h-4 w-4" />
              検索
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>発注データ一覧</CardTitle>
            <CardDescription>入荷処理する発注データを選択してください</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSelectAll}>
              {selectAll ? "全選択解除" : "全選択"}
            </Button>
            <Button onClick={handleBulkArrival} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  一括入荷処理実行
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
