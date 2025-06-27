"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, Edit, FileText, Plus, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

// Update the formSchema to include the new fields
const formSchema = z.object({
  receivingNumber: z.string(),
  vendorId: z.string().min(1, { message: "取引先を選択してください" }),
  receivingDate: z.date(),
  deliveryDate: z.date(),
  receivingType: z.string().min(1, { message: "仕入形態を選択してください" }),
  paymentTerms: z.string().min(1, { message: "支払条件を選択してください" }),
  paymentTermsText: z.string().optional(),
  department: z.string().min(1, { message: "部門を選択してください" }),
  personInCharge: z.string().min(1, { message: "担当者を選択してください" }),
  currency: z.string().min(1, { message: "通貨を選択してください" }),
  deliveryType: z.enum(["company", "customer"]),
  warehouseCode: z.string().optional(),
  warehouseName: z.string().optional(),
  deliveryDestinationCode: z.string().optional(),
  deliveryDestinationName: z.string().optional(),
  receivingTitle: z.string().optional(),
  supplierPostalCode: z.string().optional(),
  supplierAddress: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  deliveryAddress: z.string().optional(),
  receivingOrderSummary: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.number(),
        itemCode: z.string().min(1, { message: "品目コードを入力してください" }),
        itemName: z.string().min(1, { message: "品目名を入力してください" }),
        warehouseCode: z.string().min(1, { message: "倉庫コードを入力してください" }),
        warehouseName: z.string().min(1, { message: "倉庫名を入力してください" }),
        quantity: z.number().min(1, { message: "数量は1以上である必要があります" }),
        unitPrice: z.number().min(0, { message: "単価は0以上である必要があります" }),
        amount: z.number(),
      }),
    )
    .min(1, { message: "少なくとも1つの明細を追加してください" }),
})

type FormValues = z.infer<typeof formSchema>
type ItemType = z.infer<typeof formSchema.shape.items.element>

// サンプルデータ
const vendors = [
  { value: "1", label: "株式会社山田製作所" },
  { value: "2", label: "東京電子工業株式会社" },
  { value: "3", label: "大阪金属工業株式会社" },
  { value: "4", label: "名古屋機械工業株式会社" },
  { value: "5", label: "福岡精密機器株式会社" },
  { value: "6", label: "札幌工業株式会社" },
  { value: "7", label: "仙台金属加工株式会社" },
  { value: "8", label: "広島製作所" },
]

const departments = [
  { id: "1", name: "製造部" },
  { id: "2", name: "開発部" },
  { id: "3", name: "営業部" },
  { id: "4", name: "総務部" },
]

const receivingTypes = [
  { id: "regular", name: "通常仕入" },
  { id: "urgent", name: "緊急仕入" },
  { id: "planned", name: "計画仕入" },
  { id: "blanket", name: "包括仕入" },
]

const employees = [
  { id: "1", name: "田中 健太" },
  { id: "2", name: "佐藤 美咲" },
  { id: "3", name: "鈴木 大輔" },
  { id: "4", name: "高橋 直子" },
]

const warehouses = [
  { code: "WH001", name: "本社倉庫" },
  { code: "WH002", name: "東京倉庫" },
  { code: "WH003", name: "大阪倉庫" },
  { code: "WH004", name: "福岡倉庫" },
  { code: "SK001", name: "倉庫1" },
  { code: "SK002", name: "倉庫2" },
  { code: "SK003", name: "倉庫3" },
]

const items = [
  { code: "ITM001", name: "アルミ板 A4052 t5.0" },
  { code: "ITM002", name: "ステンレス鋼管 SUS304 φ60.5" },
  { code: "ITM003", name: "六角ボルト M10×30" },
  { code: "ITM004", name: "フラットワッシャー M10" },
  { code: "ITM005", name: "シリコンゴムシート t1.0" },
]

// Add sample delivery destinations
const deliveryDestinations = [
  { code: "DL001", name: "東京本社" },
  { code: "DL002", name: "大阪支店" },
  { code: "DL003", name: "名古屋工場" },
  { code: "DL004", name: "福岡営業所" },
]

export default function NewReceivingPage() {
  const [detailItems, setDetailItems] = useState<ItemType[]>([
    {
      id: 1,
      itemCode: "ITM001",
      itemName: "アルミ板 A4052 t5.0",
      warehouseCode: "WH001",
      warehouseName: "本社倉庫",
      quantity: 10,
      unitPrice: 1500,
      amount: 15000,
    },
    {
      id: 2,
      itemCode: "ITM003",
      itemName: "六角ボルト M10×30",
      warehouseCode: "WH001",
      warehouseName: "本社倉庫",
      quantity: 5,
      unitPrice: 300,
      amount: 1500,
    },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<ItemType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"company" | "customer">("company")

  // まず、新しい状態変数を追加します
  const [newItem, setNewItem] = useState<Partial<ItemType>>({
    itemCode: "",
    itemName: "",
    warehouseCode: "",
    warehouseName: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  })

  // Update the form default values to include the new fields
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receivingNumber: "RCV-2023-0459",
      receivingDate: new Date(),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
      receivingType: "regular",
      currency: "JPY",
      paymentTerms: "30days",
      paymentTermsText: "",
      department: "1",
      personInCharge: "1",
      deliveryType: "company",
      warehouseCode: "SK002",
      warehouseName: "倉庫2",
      deliveryDestinationCode: "",
      deliveryDestinationName: "",
      receivingTitle: "",
      supplierPostalCode: "",
      supplierAddress: "",
      deliveryPostalCode: "",
      deliveryAddress: "",
      receivingOrderSummary: "",
      internalNotes: "",
      items: detailItems,
    },
  })

  function onSubmit(data: FormValues) {
    console.log(data)
    // 実際のアプリケーションではここでAPIを呼び出して仕入データを保存
    alert("仕入データが作成されました")
  }

  const openAddDialog = () => {
    setCurrentItem({
      id: detailItems.length > 0 ? Math.max(...detailItems.map((item) => item.id)) + 1 : 1,
      itemCode: "",
      itemName: "",
      warehouseCode: "",
      warehouseName: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: ItemType) => {
    setCurrentItem({ ...item })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleSaveItem = () => {
    if (!currentItem) return

    // 金額を計算
    const amount = currentItem.quantity * currentItem.unitPrice

    const updatedItem = {
      ...currentItem,
      amount,
    }

    if (isEditing) {
      // 既存の明細を更新
      const updatedItems = detailItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      setDetailItems(updatedItems)
      form.setValue("items", updatedItems)
    } else {
      // 新しい明細を追加
      const newItems = [...detailItems, updatedItem]
      setDetailItems(newItems)
      form.setValue("items", newItems)
    }

    setIsDialogOpen(false)
  }

  const handleDeleteItem = (id: number) => {
    const newItems = detailItems.filter((item) => item.id !== id)
    setDetailItems(newItems)
    form.setValue("items", newItems)
  }

  const handleItemChange = (field: keyof ItemType, value: string | number) => {
    if (!currentItem) return

    const updatedItem = { ...currentItem, [field]: value }

    // 品目コードが変更された場合、品目名も更新
    if (field === "itemCode") {
      const selectedItem = items.find((item) => item.code === value)
      if (selectedItem) {
        updatedItem.itemName = selectedItem.name
      }
    }

    // 倉庫コードが変更された場合、倉庫名も更新
    if (field === "warehouseCode") {
      const selectedWarehouse = warehouses.find((wh) => wh.code === value)
      if (selectedWarehouse) {
        updatedItem.warehouseName = selectedWarehouse.name
      }
    }

    // 数量または単価が変更された場合、金額を再計算
    if (field === "quantity" || field === "unitPrice") {
      updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
    }

    setCurrentItem(updatedItem)
  }

  const calculateTotal = () => {
    return detailItems.reduce((sum, item) => sum + item.amount, 0)
  }

  // Update the handleDeliveryTypeChange function
  const handleDeliveryTypeChange = (value: "company" | "customer") => {
    setDeliveryType(value)
    form.setValue("deliveryType", value)

    // Reset the related fields when changing delivery type
    if (value === "company") {
      form.setValue("warehouseCode", "SK002")
      form.setValue("warehouseName", "倉庫2")
      form.setValue("deliveryDestinationCode", "")
      form.setValue("deliveryDestinationName", "")
    } else {
      form.setValue("warehouseCode", "")
      form.setValue("warehouseName", "")
      form.setValue("deliveryDestinationCode", "DL001")
      form.setValue("deliveryDestinationName", "東京本社")
    }
  }

  // Find warehouse name by code
  const getWarehouseName = (code: string) => {
    const warehouse = warehouses.find((w) => w.code === code)
    return warehouse ? warehouse.name : ""
  }

  // Add function to get delivery destination name by code
  const getDeliveryDestinationName = (code: string) => {
    const destination = deliveryDestinations.find((d) => d.code === code)
    return destination ? destination.name : ""
  }

  // 新規登録行用のハンドラを追加します
  const handleNewItemChange = (field: keyof ItemType, value: string | number) => {
    const updatedItem = { ...newItem, [field]: value }

    // 品目コードが変更された場合、品目名も更新
    if (field === "itemCode") {
      const selectedItem = items.find((item) => item.code === value)
      if (selectedItem) {
        updatedItem.itemName = selectedItem.name
      }
    }

    // 倉庫コードが変更された場合、倉庫名も更新
    if (field === "warehouseCode") {
      const selectedWarehouse = warehouses.find((wh) => wh.code === value)
      if (selectedWarehouse) {
        updatedItem.warehouseName = selectedWarehouse.name
      }
    }

    // 数量または単価が変更された場合、金額を再計算
    if (field === "quantity" || field === "unitPrice") {
      const quantity = typeof updatedItem.quantity === "number" ? updatedItem.quantity : 0
      const unitPrice = typeof updatedItem.unitPrice === "number" ? updatedItem.unitPrice : 0
      updatedItem.amount = quantity * unitPrice
    }

    setNewItem(updatedItem)
  }

  // 新規登録行を追加するハンドラ
  const handleAddNewItem = () => {
    if (!newItem.itemCode || !newItem.warehouseCode) return

    const newItemComplete = {
      id: detailItems.length > 0 ? Math.max(...detailItems.map((item) => item.id)) + 1 : 1,
      itemCode: newItem.itemCode as string,
      itemName: newItem.itemName as string,
      warehouseCode: newItem.warehouseCode as string,
      warehouseName: newItem.warehouseName as string,
      quantity: typeof newItem.quantity === "number" ? newItem.quantity : 1,
      unitPrice: typeof newItem.unitPrice === "number" ? newItem.unitPrice : 0,
      amount: typeof newItem.amount === "number" ? newItem.amount : 0,
    }

    const newItems = [...detailItems, newItemComplete]
    setDetailItems(newItems)
    form.setValue("items", newItems)

    // 新規登録行をリセット
    setNewItem({
      itemCode: "",
      itemName: "",
      warehouseCode: "",
      warehouseName: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    })
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">仕入入力</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-4">
              <div className="grid gap-4 md:grid-cols-6">
                <FormField
                  control={form.control}
                  name="receivingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">仕入番号</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">仕入日 *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy年MM月dd日", {
                                  locale: ja,
                                })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">部門 *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={departments.map((dept) => ({ value: dept.id, label: dept.name }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="部門を選択または入力"
                          emptyMessage="該当する部門がありません"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personInCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">担当者 *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="担当者を選択または入力"
                          emptyMessage="該当する担当者がありません"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">納期 *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy年MM月dd日", {
                                  locale: ja,
                                })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">仕入形態 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="仕入形態を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {receivingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">取引先 *</FormLabel>
                        <FormControl>
                          <Combobox
                            options={vendors}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="取引先を選択または入力"
                            emptyMessage="該当する取引先がありません"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryType"
                    render={({ field }) => (
                      <FormItem className="space-y-1 flex items-center">
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => handleDeliveryTypeChange(value as "company" | "customer")}
                            defaultValue={field.value}
                            className="flex items-center space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="company" id="company" />
                              <FormLabel htmlFor="company" className="font-normal cursor-pointer">
                                自社倉庫
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="customer" id="customer" />
                              <FormLabel htmlFor="customer" className="font-normal cursor-pointer">
                                客先直送
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {deliveryType === "company" ? (
                    <>
                      <FormField
                        control={form.control}
                        name="warehouseCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="bg-blue-100 px-4 py-2 block">倉庫コード</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  form.setValue("warehouseName", getWarehouseName(value))
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="倉庫コードを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses
                                    .filter((w) => w.code.startsWith("SK"))
                                    .map((warehouse) => (
                                      <SelectItem key={warehouse.code} value={warehouse.code}>
                                        {warehouse.code}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="warehouseName"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="bg-blue-100 px-4 py-2 block">倉庫名</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="deliveryDestinationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="bg-blue-100 px-4 py-2 block">納入先</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value)
                                  form.setValue("deliveryDestinationName", getDeliveryDestinationName(value))
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="納入先を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {deliveryDestinations.map((dest) => (
                                    <SelectItem key={dest.code} value={dest.code}>
                                      {dest.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryDestinationName"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="bg-blue-100 px-4 py-2 block">納入先名</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="basic">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">基本情報</TabsTrigger>
                  <TabsTrigger value="details">明細情報</TabsTrigger>
                  <TabsTrigger value="attachments">添付資料</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <FormField
                        control={form.control}
                        name="receivingTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="bg-blue-100 px-4 py-2 block">仕入件名</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="仕入件名を入力してください" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">仕入先住所</h3>
                      <div className="grid grid-cols-4 gap-3">
                        <FormField
                          control={form.control}
                          name="supplierPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="bg-blue-100 px-4 py-2 block">郵便番号</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="000-0000" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="supplierAddress"
                          render={({ field }) => (
                            <FormItem className="col-span-3">
                              <FormLabel className="bg-blue-100 px-4 py-2 block">住所</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="住所を入力してください" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">納入先住所</h3>
                      <div className="grid grid-cols-4 gap-3">
                        <FormField
                          control={form.control}
                          name="deliveryPostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="bg-blue-100 px-4 py-2 block">郵便番号</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="000-0000" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryAddress"
                          render={({ field }) => (
                            <FormItem className="col-span-3">
                              <FormLabel className="bg-blue-100 px-4 py-2 block">住所</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="住所を入力してください" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">支払条件</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="bg-blue-100 px-4 py-2 block">支払条件 *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="支払条件を選択" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="immediate">即時払い</SelectItem>
                                  <SelectItem value="15days">15日以内</SelectItem>
                                  <SelectItem value="30days">30日以内</SelectItem>
                                  <SelectItem value="60days">60日以内</SelectItem>
                                  <SelectItem value="endOfMonth">月末締め翌月末払い</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="paymentTermsText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="bg-blue-100 px-4 py-2 block">支払条件表記</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="支払条件の詳細を入力してください" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="receivingOrderSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">仕入書摘要</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="仕入書に記載する摘要を入力してください" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="internalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">社内摘要</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="社内用の摘要を入力してください" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="details">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">仕入明細</h3>
                      <Button onClick={openAddDialog} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        明細追加
                      </Button>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">明細No.</TableHead>
                            <TableHead>品目コード</TableHead>
                            <TableHead>品目名</TableHead>
                            <TableHead>倉庫コード</TableHead>
                            <TableHead>倉庫名</TableHead>
                            <TableHead className="text-right">仕入数量</TableHead>
                            <TableHead className="text-right">仕入単価</TableHead>
                            <TableHead className="text-right">仕入金額</TableHead>
                            <TableHead className="w-[100px]">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-3 text-muted-foreground">
                                明細がありません。下の行に入力するか「明細追加」ボタンをクリックして明細を追加してください。
                              </TableCell>
                            </TableRow>
                          ) : (
                            detailItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.id}</TableCell>
                                <TableCell>{item.itemCode}</TableCell>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell>{item.warehouseCode}</TableCell>
                                <TableCell>{item.warehouseName}</TableCell>
                                <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{item.amount.toLocaleString()} </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                          {detailItems.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-right font-medium">
                                合計:
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {calculateTotal().toLocaleString()}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          )}
                          {/* 新規登録行 */}
                          <TableRow>
                            <TableCell>新規</TableCell>
                            <TableCell>
                              <Select
                                value={newItem.itemCode as string}
                                onValueChange={(value) => handleNewItemChange("itemCode", value)}
                              >
                                <SelectTrigger className="h-8 min-h-8">
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.code} value={item.code}>
                                      {item.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input value={newItem.itemName as string} className="h-8 min-h-8" readOnly />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={newItem.warehouseCode as string}
                                onValueChange={(value) => handleNewItemChange("warehouseCode", value)}
                              >
                                <SelectTrigger className="h-8 min-h-8">
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses.map((warehouse) => (
                                    <SelectItem key={warehouse.code} value={warehouse.code}>
                                      {warehouse.code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input value={newItem.warehouseName as string} className="h-8 min-h-8" readOnly />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={newItem.quantity as number}
                                onChange={(e) => handleNewItemChange("quantity", Number(e.target.value) || 0)}
                                className="h-8 min-h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={newItem.unitPrice as number}
                                onChange={(e) => handleNewItemChange("unitPrice", Number(e.target.value) || 0)}
                                className="h-8 min-h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={((newItem.amount as number) || 0).toLocaleString()}
                                className="h-8 min-h-8 text-right"
                                readOnly
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddNewItem}
                                disabled={!newItem.itemCode || !newItem.warehouseCode}
                              >
                                追加
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attachments">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">添付資料</h3>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        ファイル追加
                      </Button>
                    </div>

                    <div className="rounded-md border p-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="rounded-full bg-muted p-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-medium">添付ファイルがありません</h3>
                        <p className="text-sm text-muted-foreground">
                          「ファイル追加」ボタンをクリックして、仕入に関連するファイルを添付してください。
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
              <Button variant="default" type="submit">
                <Save className="mr-2 h-4 w-4" />
                更新
              </Button>
              <Button variant="outline">キャンセル</Button>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                伝票印刷
              </Button>
              <Button variant="outline">
                <X className="mr-2 h-4 w-4" />
                閉じる
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "明細編集" : "明細追加"}</DialogTitle>
          </DialogHeader>
          {currentItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="itemCode">
                    品目コード *
                  </FormLabel>
                  <Select value={currentItem.itemCode} onValueChange={(value) => handleItemChange("itemCode", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="品目コードを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="itemName">
                    品目名
                  </FormLabel>
                  <Input
                    id="itemName"
                    value={currentItem.itemName}
                    onChange={(e) => handleItemChange("itemName", e.target.value)}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="warehouseCode">
                    倉庫コード *
                  </FormLabel>
                  <Select
                    value={currentItem.warehouseCode}
                    onValueChange={(value) => handleItemChange("warehouseCode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="倉庫コードを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.code} value={warehouse.code}>
                          {warehouse.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="warehouseName">
                    倉庫名
                  </FormLabel>
                  <Input
                    id="warehouseName"
                    value={currentItem.warehouseName}
                    onChange={(e) => handleItemChange("warehouseName", e.target.value)}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="quantity">
                    仕入数量 *
                  </FormLabel>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => handleItemChange("quantity", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="unitPrice">
                    仕入単価 *
                  </FormLabel>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    value={currentItem.unitPrice}
                    onChange={(e) => handleItemChange("unitPrice", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="amount">
                  仕入金額
                </FormLabel>
                <Input id="amount" value={currentItem.amount.toLocaleString()} readOnly />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveItem}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
