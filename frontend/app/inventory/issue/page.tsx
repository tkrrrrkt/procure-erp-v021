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
import { cn } from "@/lib/utils"

// フォームのスキーマを定義
const formSchema = z.object({
  issueNumber: z.string(),
  issueDate: z.date(),
  department: z.string().min(1, { message: "部門を選択してください" }),
  personInCharge: z.string().min(1, { message: "担当者を選択してください" }),
  issueType: z.string().min(1, { message: "出庫形態を選択してください" }),
  sourceWarehouseId: z.string().min(1, { message: "出庫倉庫を選択してください" }),
  destinationWarehouseId: z.string().min(1, { message: "入庫倉庫を選択してください" }),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.number(),
        itemCode: z.string().min(1, { message: "品目コードを入力してください" }),
        itemName: z.string().min(1, { message: "品目名を入力してください" }),
        stockQuantity: z.number(),
        issueQuantity: z.number().min(1, { message: "数量は1以上である必要があります" }),
        unit: z.string().min(1, { message: "単位を選択してください" }),
      }),
    )
    .min(1, { message: "少なくとも1つの明細を追加してください" }),
})

type FormValues = z.infer<typeof formSchema>
type ItemType = z.infer<typeof formSchema.shape.items.element>

// サンプルデータ
const departments = [
  { id: "1", name: "製造部" },
  { id: "2", name: "開発部" },
  { id: "3", name: "営業部" },
  { id: "4", name: "総務部" },
]

const issueTypes = [
  { id: "normal", name: "通常出庫" },
  { id: "transfer", name: "移動出庫" },
  { id: "inventory", name: "棚卸出庫" },
  { id: "adjustment", name: "調整出庫" },
  { id: "other", name: "その他" },
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
  { code: "ITM001", name: "アルミ板 A4052 t5.0", unit: "枚" },
  { code: "ITM002", name: "ステンレス鋼管 SUS304 φ60.5", unit: "本" },
  { code: "ITM003", name: "六角ボルト M10×30", unit: "個" },
  { code: "ITM004", name: "フラットワッシャー M10", unit: "個" },
  { code: "ITM005", name: "シリコンゴムシート t1.0", unit: "枚" },
  { code: "P001", name: "ボールペン", unit: "本" },
  { code: "P002", name: "ノート", unit: "冊" },
  { code: "P003", name: "消しゴム", unit: "個" },
  { code: "P004", name: "ホチキス", unit: "個" },
  { code: "P005", name: "クリップ", unit: "箱" },
]

export default function InventoryIssuePage() {
  const [detailItems, setDetailItems] = useState<ItemType[]>([
    {
      id: 1,
      itemCode: "ITM001",
      itemName: "アルミ板 A4052 t5.0",
      stockQuantity: 100,
      issueQuantity: 10,
      unit: "枚",
    },
    {
      id: 2,
      itemCode: "ITM003",
      itemName: "六角ボルト M10×30",
      stockQuantity: 500,
      issueQuantity: 50,
      unit: "個",
    },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<ItemType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newItem, setNewItem] = useState<Partial<ItemType>>({
    itemCode: "",
    itemName: "",
    stockQuantity: 0,
    issueQuantity: 1,
    unit: "",
  })

  // フォームの初期化
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueNumber: "IS-2023-0123",
      issueDate: new Date(),
      department: "1",
      personInCharge: "1",
      issueType: "normal",
      sourceWarehouseId: "WH001",
      destinationWarehouseId: "WH002",
      notes: "",
      items: detailItems,
    },
  })

  function onSubmit(data: FormValues) {
    console.log(data)
    // 実際のアプリケーションではここでAPIを呼び出して出庫データを保存
    alert("出庫伝票が作成されました")
  }

  const openAddDialog = () => {
    setCurrentItem({
      id: detailItems.length > 0 ? Math.max(...detailItems.map((item) => item.id)) + 1 : 1,
      itemCode: "",
      itemName: "",
      stockQuantity: 0,
      issueQuantity: 1,
      unit: "",
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

    if (isEditing) {
      // 既存の明細を更新
      const updatedItems = detailItems.map((item) => (item.id === currentItem.id ? currentItem : item))
      setDetailItems(updatedItems)
      form.setValue("items", updatedItems)
    } else {
      // 新しい明細を追加
      const newItems = [...detailItems, currentItem]
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

    // 品目コードが変更された場合、品目名と単位も更新
    if (field === "itemCode") {
      const selectedItem = items.find((item) => item.code === value)
      if (selectedItem) {
        updatedItem.itemName = selectedItem.name
        updatedItem.unit = selectedItem.unit
        // 在庫数量をランダムに設定（実際のアプリケーションではAPIから取得）
        updatedItem.stockQuantity = Math.floor(Math.random() * 1000) + 100
      }
    }

    setCurrentItem(updatedItem)
  }

  // 新規登録行用のハンドラ
  const handleNewItemChange = (field: keyof ItemType, value: string | number) => {
    const updatedItem = { ...newItem, [field]: value }

    // 品目コードが変更された場合、品目名と単位も更新
    if (field === "itemCode") {
      const selectedItem = items.find((item) => item.code === value)
      if (selectedItem) {
        updatedItem.itemName = selectedItem.name
        updatedItem.unit = selectedItem.unit
        // 在庫数量をランダムに設定（実際のアプリケーションではAPIから取得）
        updatedItem.stockQuantity = Math.floor(Math.random() * 1000) + 100
      }
    }

    setNewItem(updatedItem)
  }

  // 新規登録行を追加するハンドラ
  const handleAddNewItem = () => {
    if (!newItem.itemCode || !newItem.unit) return

    const newItemComplete = {
      id: detailItems.length > 0 ? Math.max(...detailItems.map((item) => item.id)) + 1 : 1,
      itemCode: newItem.itemCode as string,
      itemName: newItem.itemName as string,
      stockQuantity: typeof newItem.stockQuantity === "number" ? newItem.stockQuantity : 0,
      issueQuantity: typeof newItem.issueQuantity === "number" ? newItem.issueQuantity : 1,
      unit: newItem.unit as string,
    }

    const newItems = [...detailItems, newItemComplete]
    setDetailItems(newItems)
    form.setValue("items", newItems)

    // 新規登録行をリセット
    setNewItem({
      itemCode: "",
      itemName: "",
      stockQuantity: 0,
      issueQuantity: 1,
      unit: "",
    })
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">出庫入力</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-4">
              <div className="grid gap-4 md:grid-cols-6">
                <FormField
                  control={form.control}
                  name="issueNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">出庫番号</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">出庫日 *</FormLabel>
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
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">出庫形態 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="出庫形態を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issueTypes.map((type) => (
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
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">出庫倉庫 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="出庫倉庫を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.code} value={warehouse.code}>
                              {warehouse.name}
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
                    name="destinationWarehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">入庫倉庫 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="入庫倉庫を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.code} value={warehouse.code}>
                                {warehouse.name}
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormLabel className="bg-blue-100 px-4 py-2 block">備考</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="備考を入力してください" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">明細情報</TabsTrigger>
                  <TabsTrigger value="attachments">添付資料</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">出庫明細</h3>
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
                            <TableHead className="text-right">在庫数量</TableHead>
                            <TableHead className="text-right">出庫数量</TableHead>
                            <TableHead>単位</TableHead>
                            <TableHead className="w-[100px]">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-3 text-muted-foreground">
                                明細がありません。下の行に入力するか「明細追加」ボタンをクリックして明細を追加してください。
                              </TableCell>
                            </TableRow>
                          ) : (
                            detailItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.id}</TableCell>
                                <TableCell>{item.itemCode}</TableCell>
                                <TableCell>{item.itemName}</TableCell>
                                <TableCell className="text-right">{item.stockQuantity.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{item.issueQuantity.toLocaleString()}</TableCell>
                                <TableCell>{item.unit}</TableCell>
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
                            <TableCell className="text-right">
                              {(newItem.stockQuantity as number)?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={newItem.issueQuantity as number}
                                onChange={(e) => handleNewItemChange("issueQuantity", Number(e.target.value) || 0)}
                                className="h-8 min-h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input value={newItem.unit as string} className="h-8 min-h-8" readOnly />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddNewItem}
                                disabled={!newItem.itemCode || !newItem.unit}
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
                          「ファイル追加」ボタンをクリックして、出庫に関連するファイルを添付してください。
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
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="stockQuantity">
                    在庫数量
                  </FormLabel>
                  <Input id="stockQuantity" value={currentItem.stockQuantity} readOnly />
                </div>
                <div className="space-y-2">
                  <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="issueQuantity">
                    出庫数量 *
                  </FormLabel>
                  <Input
                    id="issueQuantity"
                    type="number"
                    min="1"
                    value={currentItem.issueQuantity}
                    onChange={(e) => handleItemChange("issueQuantity", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FormLabel className="bg-blue-100 px-4 py-2 block" htmlFor="unit">
                  単位
                </FormLabel>
                <Input id="unit" value={currentItem.unit} readOnly />
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
