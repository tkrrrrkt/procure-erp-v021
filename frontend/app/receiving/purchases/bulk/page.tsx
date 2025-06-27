"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PurchaseOrderItem {
  id: string
  orderNumber: string
  arrivalNumber: string | null
  dueDate: Date
  department: string
  employee: string
  warehouse: string
  product: string
  quantity: number
  unitPrice: number
  amount: number
  selected: boolean
}

export default function BulkPurchasePage() {
  const [date, setDate] = useState<Date>()
  const [employee, setEmployee] = useState("")
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [department, setDepartment] = useState("")
  const [departmentOpen, setDepartmentOpen] = useState(false)
  const [vendor, setVendor] = useState("")
  const [vendorOpen, setVendorOpen] = useState(false)
  const [warehouse, setWarehouse] = useState("")
  const [warehouseOpen, setWarehouseOpen] = useState(false)
  const [product, setProduct] = useState("")
  const [productOpen, setProductOpen] = useState(false)
  const [orderDateRange, setOrderDateRange] = useState<DateRange | undefined>()
  const [arrivalDateRange, setArrivalDateRange] = useState<DateRange | undefined>()
  const [orderNumberFrom, setOrderNumberFrom] = useState("")
  const [orderNumberTo, setOrderNumberTo] = useState("")
  const [arrivalNumberFrom, setArrivalNumberFrom] = useState("")
  const [arrivalNumberTo, setArrivalNumberTo] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<PurchaseOrderItem[]>([])

  // Mock data for dropdowns
  const employees = [
    { label: "山田 太郎", value: "yamada" },
    { label: "佐藤 次郎", value: "sato" },
    { label: "鈴木 三郎", value: "suzuki" },
  ]

  const departments = [
    { label: "購買部", value: "purchase" },
    { label: "営業部", value: "sales" },
    { label: "生産部", value: "production" },
  ]

  const vendors = [
    { label: "株式会社ABC商事", value: "abc" },
    { label: "XYZ産業株式会社", value: "xyz" },
    { label: "123製造株式会社", value: "123" },
  ]

  const warehouses = [
    { label: "東京倉庫", value: "tokyo" },
    { label: "大阪倉庫", value: "osaka" },
    { label: "名古屋倉庫", value: "nagoya" },
  ]

  const products = [
    { label: "製品A-100", value: "a100" },
    { label: "製品B-200", value: "b200" },
    { label: "製品C-300", value: "c300" },
  ]

  // Mock data for demo purposes
  const mockPurchaseOrders = [
    {
      id: "po1",
      orderNumber: "PO-2023-0001",
      arrivalNumber: "ARR-2023-0001",
      dueDate: new Date(2023, 10, 15),
      department: "購買部",
      employee: "山田 太郎",
      warehouse: "東京倉庫",
      product: "製品A-100",
      quantity: 10,
      unitPrice: 1000,
      amount: 10000,
      selected: false,
    },
    {
      id: "po2",
      orderNumber: "PO-2023-0002",
      arrivalNumber: "ARR-2023-0002",
      dueDate: new Date(2023, 10, 20),
      department: "営業部",
      employee: "佐藤 次郎",
      warehouse: "大阪倉庫",
      product: "製品B-200",
      quantity: 5,
      unitPrice: 2000,
      amount: 10000,
      selected: false,
    },
    {
      id: "po3",
      orderNumber: "PO-2023-0003",
      arrivalNumber: null,
      dueDate: new Date(2023, 10, 25),
      department: "生産部",
      employee: "鈴木 三郎",
      warehouse: "名古屋倉庫",
      product: "製品C-300",
      quantity: 20,
      unitPrice: 500,
      amount: 10000,
      selected: false,
    },
    {
      id: "po4",
      orderNumber: "PO-2023-0004",
      arrivalNumber: null,
      dueDate: new Date(2023, 11, 5),
      department: "購買部",
      employee: "山田 太郎",
      warehouse: "東京倉庫",
      product: "製品A-100",
      quantity: 15,
      unitPrice: 1000,
      amount: 15000,
      selected: false,
    },
    {
      id: "po5",
      orderNumber: "PO-2023-0005",
      arrivalNumber: null,
      dueDate: new Date(2023, 11, 10),
      department: "営業部",
      employee: "佐藤 次郎",
      warehouse: "大阪倉庫",
      product: "製品B-200",
      quantity: 8,
      unitPrice: 2000,
      amount: 16000,
      selected: false,
    },
  ]

  const search = () => {
    setSearching(true)
    // Simulate API call delay
    setTimeout(() => {
      setPurchaseOrderItems(mockPurchaseOrders)
      setSearching(false)
    }, 1000)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setPurchaseOrderItems(
      purchaseOrderItems.map((item) => ({
        ...item,
        selected: checked,
      })),
    )
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    const updatedItems = purchaseOrderItems.map((item) => (item.id === id ? { ...item, selected: checked } : item))
    setPurchaseOrderItems(updatedItems)
    setSelectAll(updatedItems.every((item) => item.selected))
  }

  const handleExecute = () => {
    const selectedItems = purchaseOrderItems.filter((item) => item.selected)
    if (selectedItems.length > 0) {
      setShowConfirmation(true)
    }
  }

  const processPurchases = () => {
    setLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      // In a real app, this would make an API call to process the purchases
      setLoading(false)
      setShowConfirmation(false)

      // Reset selected items
      setPurchaseOrderItems(
        purchaseOrderItems.map((item) => ({
          ...item,
          selected: false,
        })),
      )
      setSelectAll(false)

      // Display success message or update the UI
      alert("選択された発注に対する仕入処理が完了しました。")
    }, 2000)
  }

  const selectedCount = purchaseOrderItems.filter((item) => item.selected).length

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>一括仕入処理</CardTitle>
          <CardDescription>発注情報を検索して一括で仕入処理を行います。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* 担当者 */}
              <div className="space-y-2">
                <Label htmlFor="employee">担当者</Label>
                <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeOpen}
                      className="w-full justify-between"
                    >
                      {employee ? employees.find((item) => item.value === employee)?.label : "担当者を選択してください"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="担当者を検索..." />
                      <CommandList>
                        <CommandEmpty>担当者が見つかりません。</CommandEmpty>
                        <CommandGroup>
                          {employees.map((item) => (
                            <CommandItem
                              key={item.value}
                              onSelect={(currentValue) => {
                                setEmployee(currentValue === employee ? "" : item.value)
                                setEmployeeOpen(false)
                              }}
                            >
                              <Check
                                className={cn("mr-2 h-4 w-4", employee === item.value ? "opacity-100" : "opacity-0")}
                              />
                              {item.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 仕入日 */}
              <div className="space-y-2">
                <Label htmlFor="purchase-date">仕入日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "yyyy/MM/dd") : "日付を選択してください"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 倉庫 */}
              <div className="space-y-2">
                <Label htmlFor="warehouse">倉庫</Label>
                <Popover open={warehouseOpen} onOpenChange={setWarehouseOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={warehouseOpen}
                      className="w-full justify-between"
                    >
                      {warehouse
                        ? warehouses.find((item) => item.value === warehouse)?.label
                        : "倉庫を選択してください"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="倉庫を検索..." />
                      <CommandList>
                        <CommandEmpty>倉庫が見つかりません。</CommandEmpty>
                        <CommandGroup>
                          {warehouses.map((item) => (
                            <CommandItem
                              key={item.value}
                              onSelect={(currentValue) => {
                                setWarehouse(currentValue === warehouse ? "" : item.value)
                                setWarehouseOpen(false)
                              }}
                            >
                              <Check
                                className={cn("mr-2 h-4 w-4", warehouse === item.value ? "opacity-100" : "opacity-0")}
                              />
                              {item.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* 発注日 FromTo */}
                <div className="space-y-2">
                  <Label>発注日 (From/To)</Label>
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !orderDateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {orderDateRange?.from ? (
                            orderDateRange.to ? (
                              <>
                                {format(orderDateRange.from, "yyyy/MM/dd")} - {format(orderDateRange.to, "yyyy/MM/dd")}
                              </>
                            ) : (
                              format(orderDateRange.from, "yyyy/MM/dd")
                            )
                          ) : (
                            <span>日付を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={orderDateRange?.from}
                          selected={orderDateRange}
                          onSelect={setOrderDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 発注番号 FromTo */}
                <div className="space-y-2">
                  <Label>発注番号 (From/To)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="から"
                      value={orderNumberFrom}
                      onChange={(e) => setOrderNumberFrom(e.target.value)}
                    />
                    <span>～</span>
                    <Input
                      placeholder="まで"
                      value={orderNumberTo}
                      onChange={(e) => setOrderNumberTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* 入荷日 FromTo */}
                <div className="space-y-2">
                  <Label>入荷日 (From/To)</Label>
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !arrivalDateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {arrivalDateRange?.from ? (
                            arrivalDateRange.to ? (
                              <>
                                {format(arrivalDateRange.from, "yyyy/MM/dd")} - {format(arrivalDateRange.to, "yyyy/MM/dd")}
                              </>
                            ) : (
                              format(arrivalDateRange.from, "yyyy/MM/dd")
                            )
                          ) : (
                            <span>日付を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={arrivalDateRange?.from}
                          selected={arrivalDateRange}
                          onSelect={setArrivalDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* 入荷番号 FromTo */}
                <div className="space-y-2">
                  <Label>入荷番号 (From/To)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="から"
                      value={arrivalNumberFrom}
                      onChange={(e) => setArrivalNumberFrom(e.target.value)}
                    />
                    <span>～</span>
                    <Input
                      placeholder="まで"
                      value={arrivalNumberTo}
                      onChange={(e) => setArrivalNumberTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* 発注部門/発注担当者 */}
                <div className="space-y-2">
                  <Label>発注部門</Label>
                  <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={departmentOpen}
                        className="w-full justify-between"
                      >
                        {department
                          ? departments.find((item) => item.value === department)?.label
                          : "部門を選択してください"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="部門を検索..." />
                        <CommandList>
                          <CommandEmpty>部門が見つかりません。</CommandEmpty>
                          <CommandGroup>
                            {departments.map((item) => (
                              <CommandItem
                                key={item.value}
                                onSelect={(currentValue) => {
                                  setDepartment(currentValue === department ? "" : item.value)
                                  setDepartmentOpen(false)
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", department === item.value ? "opacity-100" : "opacity-0")}
                                />
                                {item.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 仕入先 */}
                <div className="space-y-2">
                  <Label>仕入先</Label>
                  <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vendorOpen}
                        className="w-full justify-between"
                      >
                        {vendor ? vendors.find((item) => item.value === vendor)?.label : "仕入先を選択してください"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="仕入先を検索..." />
                        <CommandList>
                          <CommandEmpty>仕入先が見つかりません。</CommandEmpty>
                          <CommandGroup>
                            {vendors.map((item) => (
                              <CommandItem
                                key={item.value}
                                onSelect={(currentValue) => {
                                  setVendor(currentValue === vendor ? "" : item.value)
                                  setVendorOpen(false)
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", vendor === item.value ? "opacity-100" : "opacity-0")}
                                />
                                {item.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 商品 */}
                <div className="space-y-2">
                  <Label>商品</Label>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={productOpen}
                        className="w-full justify-between"
                      >
                        {product ? products.find((item) => item.value === product)?.label : "商品を選択してください"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="商品を検索..." />
                        <CommandList>
                          <CommandEmpty>商品が見つかりません。</CommandEmpty>
                          <CommandGroup>
                            {products.map((item) => (
                              <CommandItem
                                key={item.value}
                                onSelect={(currentValue) => {
                                  setProduct(currentValue === product ? "" : item.value)
                                  setProductOpen(false)
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", product === item.value ? "opacity-100" : "opacity-0")}
                                />
                                {item.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={search} disabled={searching}>
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      検索中...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      検索
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {purchaseOrderItems.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                  <Label htmlFor="select-all">すべて選択</Label>
                </div>
                <Button onClick={handleExecute} disabled={!purchaseOrderItems.some((item) => item.selected)}>
                  選択した発注を仕入処理 ({selectedCount})
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">選択</TableHead>
                      <TableHead>発注番号</TableHead>
                      <TableHead>入荷番号</TableHead>
                      <TableHead>納期</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead>担当者</TableHead>
                      <TableHead>倉庫</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">単価</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>{item.orderNumber}</TableCell>
                        <TableCell>{item.arrivalNumber || "-"}</TableCell>
                        <TableCell>{format(item.dueDate, "yyyy/MM/dd")}</TableCell>
                        <TableCell>{item.department}</TableCell>
                        <TableCell>{item.employee}</TableCell>
                        <TableCell>{item.warehouse}</TableCell>
                        <TableCell>{item.product}</TableCell>
                        <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>仕入処理の確認</AlertDialogTitle>
            <AlertDialogDescription>
              選択された{selectedCount}件の発注に対して仕入処理を実行します。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={processPurchases} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                "実行する"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </Aler
