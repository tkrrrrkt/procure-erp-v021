"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, Edit, FileText, Plus, Save, Trash2, X, AlertCircle } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// フォームスキーマの定義
const formSchema = z.object({
  requestNumber: z.string(),
  requestDate: z.date(),
  requestType: z.string().min(1, { message: "依頼区分を選択してください" }),
  requestStatus: z.string(),
  department: z.string().min(1, { message: "部門を選択してください" }),
  requester: z.string().min(1, { message: "申請者を選択してください" }),
  approver: z.string().min(1, { message: "承認者を選択してください" }),
  desiredDeliveryDate: z.date(),
  vendorId: z.string().optional(),
  deliveryType: z.enum(["company", "customer"]),
  warehouseCode: z.string().optional(),
  warehouseName: z.string().optional(),
  deliveryDestinationCode: z.string().optional(),
  deliveryDestinationName: z.string().optional(),
  requestTitle: z.string().optional(),
  requestReason: z.string().min(1, { message: "依頼理由を入力してください" }),
  supplierPostalCode: z.string().optional(),
  supplierAddress: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
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

const requestTypes = [
  { id: "normal", name: "通常依頼" },
  { id: "urgent", name: "緊急依頼" },
  { id: "planned", name: "計画依頼" },
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

// 納入先サンプルデータ
const deliveryDestinations = [
  { code: "DL001", name: "東京本社" },
  { code: "DL002", name: "大阪支店" },
  { code: "DL003", name: "名古屋工場" },
  { code: "DL004", name: "福岡営業所" },
]

export default function NewPurchaseRequestPage() {
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
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<ItemType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"company" | "customer">("company")

  // 新規登録行用の状態
  const [newItem, setNewItem] = useState<Partial<ItemType>>({
    itemCode: "",
    itemName: "",
    warehouseCode: "",
    warehouseName: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  })

  // フォームの初期値設定
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestNumber: "PR-2023-0123",
      requestDate: new Date(),
      requestType: "normal",
      requestStatus: "draft", // 下書き状態
      department: "2", // 開発部
      requester: "3", // 鈴木 大輔
      approver: "1", // 田中 健太
      desiredDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2週間後
      vendorId: "",
      deliveryType: "company",
      warehouseCode: "SK002",
      warehouseName: "倉庫2",
      deliveryDestinationCode: "",
      deliveryDestinationName: "",
      requestTitle: "",
      requestReason: "",
      supplierPostalCode: "",
      supplierAddress: "",
      deliveryPostalCode: "",
      deliveryAddress: "",
      notes: "",
      items: detailItems,
    },
  })

  function onSubmit(data: FormValues) {
    console.log(data)
    // 実際のアプリケーションではここでAPIを呼び出して発注依頼データを保存
    alert("発注依頼が作成されました")
  }

  // 明細追加ダイアログを開く
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

  // 明細編集ダイアログを開く
  const openEditDialog = (item: ItemType) => {
    setCurrentItem({ ...item })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  // 明細を保存
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

  // 明細を削除
  const handleDeleteItem = (id: number) => {
    const newItems = detailItems.filter((item) => item.id !== id)
    setDetailItems(newItems)
    form.setValue("items", newItems)
  }

  // 明細項目の変更ハンドラ
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

  // 合計金額計算
  const calculateTotal = () => {
    return detailItems.reduce((sum, item) => sum + item.amount, 0)
  }

  // 納入先タイプの変更ハンドラ
  const handleDeliveryTypeChange = (value: "company" | "customer") => {
    setDeliveryType(value)
    form.setValue("deliveryType", value)

    // 納入先タイプに応じてフィールドをリセット
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

  // 倉庫名を取得
  const getWarehouseName = (code: string) => {
    const warehouse = warehouses.find((w) => w.code === code)
    return warehouse ? warehouse.name : ""
  }

  // 納入先名を取得
  const getDeliveryDestinationName = (code: string) => {
    const destination = deliveryDestinations.find((d) => d.code === code)
    return destination ? destination.name : ""
  }

  // 新規登録行の変更ハンドラ
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

  // 新規登録行を追加
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

  // ステータスに応じたバッジを表示
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">下書き</Badge>
      case "pending":
        return <Badge variant="secondary">申請中</Badge>
      case "approved":
        return (
          <Badge variant="success" className="bg-green-100 text-green-800">
            承認済
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">却下</Badge>
      default:
        return <Badge variant="outline">下書き</Badge>
    }
  }

  // 申請ボタンのハンドラ
  const handleSubmitRequest = () => {
    form.setValue("requestStatus", "pending")
    form.handleSubmit(onSubmit)()
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">発注依頼入力</h1>
          {renderStatusBadge(form.getValues("requestStatus"))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-4">
              <div className="grid gap-4 md:grid-cols-6">
                <FormField
                  control={form.control}
                  name="requestNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">依頼番号</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">申請日 *</FormLabel>
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
                  name="requester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">申請者 *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="申請者を選択または入力"
                          emptyMessage="該当する社員がありません"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">承認者 *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="承認者を選択または入力"
                          emptyMessage="該当する社員がありません"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="desiredDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">希望納期 *</FormLabel>
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
              </div>

              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">依頼区分 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="依頼区分を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {requestTypes.map((type) => (
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

                  <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="bg-blue-100 px-4 py-2 block">希望取引先</FormLabel>
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
                      <FormItem className="space-y-1 flex items-center col-span-2">
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
                </div>

                <div className="grid grid-cols-5 gap-4">
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
                          <FormItem className="col-span-4">
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
                                onValueChange={(value) => {
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
                          <FormItem className="col-span-4">
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
                        name="requestTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="bg-blue-100 px-4 py-2 block">依頼件名</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="依頼件名を入力してください" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-3">
                      <FormField
                        control={form.control}
                        name="requestReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="bg-blue-100 px-4 py-2 block">依頼理由 *</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="発注依頼の理由を入力してください"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">備考</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="その他の情報や特記事項があれば入力してください"
                              className="min-h-[80px]"
                            />
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
                      <h3 className="text-lg font-medium">依頼明細</h3>
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
                            <TableHead className="text-right">数量</TableHead>
                            <TableHead className="text-right">単価</TableHead>
                            <TableHead className="text-right">金額</TableHead>
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
                          「ファイル追加」ボタンをクリックして、依頼に関連するファイルを添付してください。
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
                保存
              </Button>
              <Button variant="secondary" type="button" onClick={handleSubmitRequest}>
                <AlertCircle className="mr-2 h-4 w-4" />
                申請
              </Button>
              <Button variant="outline">キャンセル</Button>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
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
                    数量 *
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
                    単価 *
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
                  金額
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
