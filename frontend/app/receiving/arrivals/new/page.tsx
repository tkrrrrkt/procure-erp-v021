"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, CheckCircle, PackageCheck, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// フォームのスキーマ定義
const formSchema = z.object({
  poNumber: z.string().min(1, { message: "発注番号を入力してください" }),
  arrivalDate: z.date(),
  warehouseId: z.string().min(1, { message: "倉庫を選択してください" }),
  personInChargeId: z.string().min(1, { message: "担当者を選択してください" }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      id: z.number(),
      itemCode: z.string(),
      itemName: z.string(),
      orderedQuantity: z.number(),
      arrivedQuantity: z.number().min(0),
      unit: z.string(),
      inspectionRequired: z.boolean(),
      inspectionResult: z.enum(["pending", "passed", "failed"]),
      inspectionNotes: z.string().optional(),
    }),
  ),
})

type FormValues = z.infer<typeof formSchema>

// サンプルデータ
const purchaseOrders = [
  { id: "PO-2023-0459", vendorName: "株式会社山田製作所", orderDate: new Date(2023, 10, 15) },
  { id: "PO-2023-0458", vendorName: "東京電子工業株式会社", orderDate: new Date(2023, 10, 14) },
  { id: "PO-2023-0457", vendorName: "大阪金属工業株式会社", orderDate: new Date(2023, 10, 13) },
  { id: "PO-2023-0456", vendorName: "名古屋機械工業株式会社", orderDate: new Date(2023, 10, 10) },
]

const warehouses = [
  { id: "WH001", name: "本社倉庫" },
  { id: "WH002", name: "東京倉庫" },
  { id: "WH003", name: "大阪倉庫" },
  { id: "WH004", name: "福岡倉庫" },
]

const employees = [
  { id: "1", name: "田中 健太" },
  { id: "2", name: "佐藤 美咲" },
  { id: "3", name: "鈴木 大輔" },
  { id: "4", name: "高橋 直子" },
]

// 発注明細のサンプルデータ
const poItems = [
  {
    id: 1,
    itemCode: "ITM001",
    itemName: "アルミ板 A4052 t5.0",
    orderedQuantity: 10,
    arrivedQuantity: 0,
    unit: "枚",
    inspectionRequired: true,
    inspectionResult: "pending" as const,
    inspectionNotes: "",
  },
  {
    id: 2,
    itemCode: "ITM002",
    itemName: "ステンレス鋼管 SUS304 φ60.5",
    orderedQuantity: 5,
    arrivedQuantity: 0,
    unit: "本",
    inspectionRequired: true,
    inspectionResult: "pending" as const,
    inspectionNotes: "",
  },
  {
    id: 3,
    itemCode: "ITM003",
    itemName: "六角ボルト M10×30",
    orderedQuantity: 100,
    arrivedQuantity: 0,
    unit: "個",
    inspectionRequired: false,
    inspectionResult: "pending" as const,
    inspectionNotes: "",
  },
]

export default function NewArrivalPage() {
  const [selectedPO, setSelectedPO] = useState<string | null>(null)
  const [poDetails, setPODetails] = useState<any | null>(null)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // フォームの初期化
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      poNumber: "",
      arrivalDate: new Date(),
      warehouseId: "",
      personInChargeId: "",
      notes: "",
      items: [],
    },
  })

  // 発注番号検索ダイアログを開く
  const openSearchDialog = () => {
    setIsSearchDialogOpen(true)
    setSearchTerm("")
  }

  // 発注データを選択
  const selectPurchaseOrder = (poNumber: string) => {
    setSelectedPO(poNumber)
    setIsSearchDialogOpen(false)

    // 選択した発注データの詳細を取得（実際はAPIから取得）
    const poData = {
      poNumber,
      vendorName: purchaseOrders.find((po) => po.id === poNumber)?.vendorName || "",
      orderDate: purchaseOrders.find((po) => po.id === poNumber)?.orderDate || new Date(),
      items: poItems,
    }

    setPODetails(poData)

    // フォームの値を更新
    form.setValue("poNumber", poNumber)
    form.setValue("items", poItems)
  }

  // 入荷数量を更新
  const updateArrivedQuantity = (index: number, value: number) => {
    const items = form.getValues("items")
    items[index].arrivedQuantity = value
    form.setValue("items", items)
  }

  // 検品結果を更新
  const updateInspectionResult = (index: number, value: "pending" | "passed" | "failed") => {
    const items = form.getValues("items")
    items[index].inspectionResult = value
    form.setValue("items", items)
  }

  // 検品備考を更新
  const updateInspectionNotes = (index: number, value: string) => {
    const items = form.getValues("items")
    items[index].inspectionNotes = value
    form.setValue("items", items)
  }

  // フォーム送信処理
  const onSubmit = (data: FormValues) => {
    console.log(data)
    // 実際のアプリケーションではここでAPIを呼び出して入荷データを保存
    setIsSuccessDialogOpen(true)
  }

  // 検索結果のフィルタリング
  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">入荷処理</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="poNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">発注番号 *</FormLabel>
                      <div className="flex">
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <Button type="button" variant="outline" className="ml-2" onClick={openSearchDialog}>
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {poDetails && (
                  <>
                    <div>
                      <div className="bg-blue-100 px-4 py-2 block text-sm font-medium">取引先</div>
                      <Input value={poDetails.vendorName} readOnly />
                    </div>
                    <div>
                      <div className="bg-blue-100 px-4 py-2 block text-sm font-medium">発注日</div>
                      <Input value={format(poDetails.orderDate, "yyyy年MM月dd日", { locale: ja })} readOnly />
                    </div>
                  </>
                )}

                <FormField
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">入荷日 *</FormLabel>
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

              <div className="grid gap-4 mt-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">入荷倉庫 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="倉庫を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
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
                  name="personInChargeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">担当者 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="担当者を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">備考</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="入荷に関する備考を入力してください" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {poDetails && (
            <Card>
              <CardHeader>
                <CardTitle>入荷明細</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
                    <TableRow>
                      <TableHead>品目コード</TableHead>
                      <TableHead>品目名</TableHead>
                      <TableHead className="text-right">発注数量</TableHead>
                      <TableHead className="text-right">入荷数量 *</TableHead>
                      <TableHead>単位</TableHead>
                      <TableHead>検品</TableHead>
                      <TableHead>検品結果</TableHead>
                      <TableHead>検品備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.getValues("items").map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell className="text-right">{item.orderedQuantity.toLocaleString()}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.orderedQuantity}
                            value={item.arrivedQuantity}
                            onChange={(e) => updateArrivedQuantity(index, Number.parseInt(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {item.inspectionRequired ? (
                            <Badge className="bg-blue-100 text-blue-800">必要</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">不要</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.inspectionRequired ? (
                            <Select
                              value={item.inspectionResult}
                              onValueChange={(value: "pending" | "passed" | "failed") =>
                                updateInspectionResult(index, value)
                              }
                              disabled={item.arrivedQuantity === 0}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">未検品</SelectItem>
                                <SelectItem value="passed">合格</SelectItem>
                                <SelectItem value="failed">不合格</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.inspectionRequired ? (
                            <Input
                              value={item.inspectionNotes}
                              onChange={(e) => updateInspectionNotes(index, e.target.value)}
                              placeholder="検品備考"
                              disabled={item.arrivedQuantity === 0 || item.inspectionResult === "pending"}
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
                <Button variant="default" type="submit">
                  <PackageCheck className="mr-2 h-4 w-4" />
                  入荷処理を完了する
                </Button>
                <Button variant="outline" type="button">
                  キャンセル
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </Form>

      {/* 発注番号検索ダイアログ */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>発注番号検索</DialogTitle>
            <DialogDescription>入荷処理を行う発注データを選択してください</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Input
                placeholder="発注番号または取引先名で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
                  <TableRow>
                    <TableHead>発注番号</TableHead>
                    <TableHead>取引先</TableHead>
                    <TableHead>発注日</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        該当する発注データがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPOs.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>{po.id}</TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>{format(po.orderDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => selectPurchaseOrder(po.id)}>
                            選択
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 処理完了ダイアログ */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>入荷処理が完了しました</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p>入荷データが正常に登録されました。</p>
          </div>
          <DialogFooter>
            <Button onClick={() => (window.location.href = "/receiving/arrivals")}>入荷一覧に戻る</Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsSuccessDialogOpen(false)
                setSelectedPO(null)
                setPODetails(null)
                form.reset()
              }}
            >
              続けて入荷処理を行う
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
