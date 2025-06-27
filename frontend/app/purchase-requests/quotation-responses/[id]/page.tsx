"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, CalendarIcon, Check, Save } from "lucide-react"
import { cn } from "@/lib/utils"

// 発注依頼のサンプルデータ
const purchaseRequestsData = {
  "PR-2023-0123": {
    id: "PR-2023-0123",
    title: "開発用PCの購入",
    requester: "鈴木 大輔",
    department: "開発部",
    requestDate: new Date(2023, 10, 15),
    desiredDeliveryDate: new Date(2023, 11, 15),
    status: "approved",
    amount: 350000,
    description: "開発チーム用の高性能PCを購入したいです。プログラミングとテスト環境の構築に使用します。",
    items: [
      {
        id: 1,
        name: "開発用ノートPC",
        description: "Core i7, 32GB RAM, 1TB SSD",
        quantity: 3,
        unit: "台",
        estimatedUnitPrice: 95000,
        estimatedAmount: 285000,
      },
      {
        id: 2,
        name: "モニター",
        description: "27インチ 4K",
        quantity: 3,
        unit: "台",
        estimatedUnitPrice: 15000,
        estimatedAmount: 45000,
      },
      {
        id: 3,
        name: "ドッキングステーション",
        description: "USB-C接続",
        quantity: 2,
        unit: "個",
        estimatedUnitPrice: 10000,
        estimatedAmount: 20000,
      },
    ],
  },
  "PR-2023-0122": {
    id: "PR-2023-0122",
    title: "オフィス備品の補充",
    requester: "佐藤 美咲",
    department: "総務部",
    requestDate: new Date(2023, 10, 14),
    desiredDeliveryDate: new Date(2023, 11, 10),
    status: "approved",
    amount: 85000,
    description: "オフィス用の消耗品と備品を補充します。",
    items: [
      {
        id: 1,
        name: "コピー用紙",
        description: "A4 5000枚",
        quantity: 10,
        unit: "箱",
        estimatedUnitPrice: 2500,
        estimatedAmount: 25000,
      },
      {
        id: 2,
        name: "ボールペン",
        description: "黒・赤・青セット",
        quantity: 50,
        unit: "セット",
        estimatedUnitPrice: 300,
        estimatedAmount: 15000,
      },
      {
        id: 3,
        name: "ファイル",
        description: "A4サイズ",
        quantity: 100,
        unit: "個",
        estimatedUnitPrice: 150,
        estimatedAmount: 15000,
      },
      {
        id: 4,
        name: "付箋",
        description: "カラー5色セット",
        quantity: 30,
        unit: "パック",
        estimatedUnitPrice: 200,
        estimatedAmount: 6000,
      },
      {
        id: 5,
        name: "ホチキス",
        description: "中型",
        quantity: 20,
        unit: "個",
        estimatedUnitPrice: 500,
        estimatedAmount: 10000,
      },
      {
        id: 6,
        name: "クリアファイル",
        description: "A4 100枚入り",
        quantity: 5,
        unit: "パック",
        estimatedUnitPrice: 2800,
        estimatedAmount: 14000,
      },
    ],
  },
}

// 見積依頼先のサンプルデータ
const quotationVendors = {
  "PR-2023-0123": [
    {
      id: "V001",
      name: "株式会社テクノソリューション",
      contact: "山田太郎",
      email: "yamada@techno-solution.co.jp",
      phone: "03-1234-5678",
      category: "IT機器",
      rating: 5,
      quotationNo: "Q-2023-0501",
      quotationDate: new Date(2023, 10, 20),
      deliveryDate: new Date(2023, 11, 10),
      validUntil: new Date(2023, 11, 30),
      responseStatus: "received", // received, pending, none
      items: [
        { itemId: 1, unitPrice: 92000, amount: 276000, note: "在庫あり" },
        { itemId: 2, unitPrice: 14500, amount: 43500, note: "即納可能" },
        { itemId: 3, unitPrice: 9800, amount: 19600, note: "1週間納期" },
      ],
      totalAmount: 339100,
      note: "送料無料。保証期間3年。",
    },
    {
      id: "V003",
      name: "デジタルデバイス株式会社",
      contact: "鈴木一郎",
      email: "suzuki@digital-device.co.jp",
      phone: "03-3456-7890",
      category: "IT機器",
      rating: 3,
      quotationNo: "DD-23-1205",
      quotationDate: new Date(2023, 10, 22),
      deliveryDate: new Date(2023, 11, 20),
      validUntil: new Date(2023, 11, 30),
      responseStatus: "received",
      items: [
        { itemId: 1, unitPrice: 89000, amount: 267000, note: "2週間納期" },
        { itemId: 2, unitPrice: 13000, amount: 39000, note: "在庫あり" },
        { itemId: 3, unitPrice: 8500, amount: 17000, note: "在庫あり" },
      ],
      totalAmount: 323000,
      note: "送料別途。保証期間1年。延長保証オプションあり。",
    },
    {
      id: "V005",
      name: "ITソリューションズ株式会社",
      contact: "伊藤三郎",
      email: "ito@it-solutions.co.jp",
      phone: "03-5678-9012",
      category: "IT機器",
      rating: 5,
      quotationNo: "",
      quotationDate: null,
      deliveryDate: null,
      validUntil: null,
      responseStatus: "pending",
      items: [
        { itemId: 1, unitPrice: 0, amount: 0, note: "" },
        { itemId: 2, unitPrice: 0, amount: 0, note: "" },
        { itemId: 3, unitPrice: 0, amount: 0, note: "" },
      ],
      totalAmount: 0,
      note: "",
    },
    {
      id: "V007",
      name: "テクノハブ株式会社",
      contact: "中村洋一",
      email: "nakamura@techno-hub.co.jp",
      phone: "03-7890-1234",
      category: "IT機器",
      rating: 4,
      quotationNo: "TH-Q-2311-042",
      quotationDate: new Date(2023, 10, 21),
      deliveryDate: new Date(2023, 11, 15),
      validUntil: new Date(2023, 12, 15),
      responseStatus: "received",
      items: [
        { itemId: 1, unitPrice: 94500, amount: 283500, note: "即納可能" },
        { itemId: 2, unitPrice: 16000, amount: 48000, note: "即納可能" },
        { itemId: 3, unitPrice: 10500, amount: 21000, note: "即納可能" },
      ],
      totalAmount: 352500,
      note: "送料無料。保証期間2年。24時間サポート付き。",
    },
  ],
  "PR-2023-0122": [
    {
      id: "V002",
      name: "オフィスサプライ株式会社",
      contact: "佐藤花子",
      email: "sato@office-supply.co.jp",
      phone: "03-2345-6789",
      category: "オフィス用品",
      rating: 4,
      quotationNo: "OS-2023-1105",
      quotationDate: new Date(2023, 10, 18),
      deliveryDate: new Date(2023, 11, 5),
      validUntil: new Date(2023, 12, 18),
      responseStatus: "received",
      items: [
        { itemId: 1, unitPrice: 2400, amount: 24000, note: "在庫あり" },
        { itemId: 2, unitPrice: 280, amount: 14000, note: "在庫あり" },
        { itemId: 3, unitPrice: 140, amount: 14000, note: "在庫あり" },
        { itemId: 4, unitPrice: 180, amount: 5400, note: "在庫あり" },
        { itemId: 5, unitPrice: 480, amount: 9600, note: "在庫あり" },
        { itemId: 6, unitPrice: 2700, amount: 13500, note: "在庫あり" },
      ],
      totalAmount: 80500,
      note: "送料無料。3万円以上のご注文で5%割引。",
    },
    {
      id: "V004",
      name: "ビジネスサポート株式会社",
      contact: "高橋次郎",
      email: "takahashi@biz-support.co.jp",
      phone: "03-4567-8901",
      category: "オフィス用品",
      rating: 4,
      quotationNo: "BS-Q-2311-089",
      quotationDate: new Date(2023, 10, 19),
      deliveryDate: new Date(2023, 11, 8),
      validUntil: new Date(2023, 12, 19),
      responseStatus: "received",
      items: [
        { itemId: 1, unitPrice: 2450, amount: 24500, note: "在庫あり" },
        { itemId: 2, unitPrice: 290, amount: 14500, note: "在庫あり" },
        { itemId: 3, unitPrice: 145, amount: 14500, note: "在庫あり" },
        { itemId: 4, unitPrice: 190, amount: 5700, note: "在庫あり" },
        { itemId: 5, unitPrice: 490, amount: 9800, note: "在庫あり" },
        { itemId: 6, unitPrice: 2750, amount: 13750, note: "在庫あり" },
      ],
      totalAmount: 82750,
      note: "送料無料。初回注文10%割引。",
    },
    {
      id: "V006",
      name: "オフィスマート株式会社",
      contact: "渡辺恵子",
      email: "watanabe@office-mart.co.jp",
      phone: "03-6789-0123",
      category: "オフィス用品",
      rating: 3,
      quotationNo: "",
      quotationDate: null,
      deliveryDate: null,
      validUntil: null,
      responseStatus: "pending",
      items: [
        { itemId: 1, unitPrice: 0, amount: 0, note: "" },
        { itemId: 2, unitPrice: 0, amount: 0, note: "" },
        { itemId: 3, unitPrice: 0, amount: 0, note: "" },
        { itemId: 4, unitPrice: 0, amount: 0, note: "" },
        { itemId: 5, unitPrice: 0, amount: 0, note: "" },
        { itemId: 6, unitPrice: 0, amount: 0, note: "" },
      ],
      totalAmount: 0,
      note: "",
    },
    {
      id: "V008",
      name: "ステーショナリーワールド株式会社",
      contact: "小林幸子",
      email: "kobayashi@stationery-world.co.jp",
      phone: "03-8901-2345",
      category: "オフィス用品",
      rating: 5,
      quotationNo: "SW-Q-23-0458",
      quotationDate: new Date(2023, 10, 17),
      deliveryDate: new Date(2023, 11, 3),
      validUntil: new Date(2023, 12, 17),
      responseStatus: "received",
      items: [
        { itemId: 1, unitPrice: 2350, amount: 23500, note: "在庫あり" },
        { itemId: 2, unitPrice: 270, amount: 13500, note: "在庫あり" },
        { itemId: 3, unitPrice: 130, amount: 13000, note: "在庫あり" },
        { itemId: 4, unitPrice: 170, amount: 5100, note: "在庫あり" },
        { itemId: 5, unitPrice: 450, amount: 9000, note: "在庫あり" },
        { itemId: 6, unitPrice: 2600, amount: 13000, note: "在庫あり" },
      ],
      totalAmount: 77100,
      note: "送料無料。大口注文割引あり。翌日配送可能。",
    },
  ],
}

// ステータスに応じたバッジを表示する関数
const renderStatusBadge = (status: string) => {
  switch (status) {
    case "received":
      return (
        <Badge variant="success" className="bg-green-100 text-green-800">
          回答済
        </Badge>
      )
    case "pending":
      return <Badge variant="secondary">依頼中</Badge>
    case "none":
      return <Badge variant="outline">未依頼</Badge>
    default:
      return <Badge variant="outline">未依頼</Badge>
  }
}

// 評価に応じた星評価を表示する関数
const renderRating = (rating: number) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-sm ${i < rating ? "text-yellow-500" : "text-gray-300"}`}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function QuotationResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  // 発注依頼データを取得
  const requestData = purchaseRequestsData[requestId as keyof typeof purchaseRequestsData]
  const vendorData = quotationVendors[requestId as keyof typeof quotationVendors] || []

  const [vendors, setVendors] = useState(vendorData)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [editingVendor, setEditingVendor] = useState<any>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // 編集モードを開始
  const startEditing = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId)
    if (vendor) {
      setEditingVendor({ ...vendor })
      setEditingVendorId(vendorId)
    }
  }

  // 編集をキャンセル
  const cancelEditing = () => {
    setEditingVendor(null)
    setEditingVendorId(null)
  }

  // 編集内容を保存
  const saveEditing = () => {
    if (!editingVendor) return

    const updatedVendors = vendors.map((vendor) =>
      vendor.id === editingVendorId
        ? {
            ...vendor,
            quotationNo: editingVendor.quotationNo,
            quotationDate: editingVendor.quotationDate,
            deliveryDate: editingVendor.deliveryDate,
            validUntil: editingVendor.validUntil,
            responseStatus: "received",
            items: editingVendor.items,
            totalAmount: editingVendor.items.reduce((sum: number, item: any) => sum + item.amount, 0),
            note: editingVendor.note,
          }
        : vendor,
    )

    setVendors(updatedVendors)
    setEditingVendor(null)
    setEditingVendorId(null)
  }

  // 編集中の項目の単価を更新
  const updateItemUnitPrice = (itemId: number, unitPrice: number) => {
    if (!editingVendor) return

    const updatedItems = editingVendor.items.map((item: any) => {
      if (item.itemId === itemId) {
        const requestItem = requestData.items.find((ri) => ri.id === itemId)
        const quantity = requestItem ? requestItem.quantity : 0
        return {
          ...item,
          unitPrice,
          amount: unitPrice * quantity,
        }
      }
      return item
    })

    setEditingVendor({
      ...editingVendor,
      items: updatedItems,
    })
  }

  // 編集中の項目の備考を更新
  const updateItemNote = (itemId: number, note: string) => {
    if (!editingVendor) return

    const updatedItems = editingVendor.items.map((item: any) => {
      if (item.itemId === itemId) {
        return {
          ...item,
          note,
        }
      }
      return item
    })

    setEditingVendor({
      ...editingVendor,
      items: updatedItems,
    })
  }

  // 発注業者決定画面へ遷移
  const goToVendorDecision = () => {
    router.push(`/purchase-requests/vendor-decision/${requestId}`)
  }

  // 一覧画面に戻る
  const handleBack = () => {
    router.push("/purchase-requests")
  }

  if (!requestData) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">発注依頼が見つかりません</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">見積回答入力</h1>
        </div>
        <Button onClick={goToVendorDecision}>発注業者選定へ進む</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>発注依頼情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-sm text-gray-500">依頼番号</Label>
              <div className="font-medium">{requestData.id}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">件名</Label>
              <div className="font-medium">{requestData.title}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">申請者</Label>
              <div className="font-medium">{requestData.requester}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">部門</Label>
              <div className="font-medium">{requestData.department}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">申請日</Label>
              <div className="font-medium">{format(requestData.requestDate, "yyyy/MM/dd", { locale: ja })}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">希望納期</Label>
              <div className="font-medium">{format(requestData.desiredDeliveryDate, "yyyy/MM/dd", { locale: ja })}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">金額</Label>
              <div className="font-medium">{requestData.amount.toLocaleString()}円</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">ステータス</Label>
              <div className="font-medium">
                <Badge variant="success" className="bg-green-100 text-green-800">
                  承認済
                </Badge>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-sm text-gray-500">備考</Label>
            <div className="font-medium">{requestData.description}</div>
          </div>

          <div>
            <Label className="text-sm text-gray-500 mb-2 block">依頼明細</Label>
            <Table>
              <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>品目</TableHead>
                  <TableHead>仕様</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead>単位</TableHead>
                  <TableHead className="text-right">見積単価</TableHead>
                  <TableHead className="text-right">見積金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.estimatedUnitPrice.toLocaleString()}円</TableCell>
                    <TableCell className="text-right">{item.estimatedAmount.toLocaleString()}円</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>見積回答一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="mb-6 border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-2">
                        <span>担当: {vendor.contact}</span>
                        <span>|</span>
                        <span>{renderRating(vendor.rating)}</span>
                        <span>|</span>
                        <span>{renderStatusBadge(vendor.responseStatus)}</span>
                      </div>
                    </div>
                  </div>
                  {vendor.responseStatus !== "received" && (
                    <Button size="sm" onClick={() => startEditing(vendor.id)}>
                      回答入力
                    </Button>
                  )}
                  {vendor.responseStatus === "received" && (
                    <Button size="sm" variant="outline" onClick={() => startEditing(vendor.id)}>
                      回答編集
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {vendor.responseStatus === "received" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">見積番号</Label>
                        <div className="font-medium">{vendor.quotationNo}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">見積日</Label>
                        <div className="font-medium">
                          {vendor.quotationDate ? format(vendor.quotationDate, "yyyy/MM/dd", { locale: ja }) : "-"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">納期</Label>
                        <div className="font-medium">
                          {vendor.deliveryDate ? format(vendor.deliveryDate, "yyyy/MM/dd", { locale: ja }) : "-"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">有効期限</Label>
                        <div className="font-medium">
                          {vendor.validUntil ? format(vendor.validUntil, "yyyy/MM/dd", { locale: ja }) : "-"}
                        </div>
                      </div>
                    </div>

                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>No.</TableHead>
                          <TableHead>品目</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead className="text-right">単価</TableHead>
                          <TableHead className="text-right">金額</TableHead>
                          <TableHead>備考</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.items.map((item: any) => {
                          const requestItem = requestData.items.find((ri) => ri.id === item.itemId)
                          return requestItem ? (
                            <TableRow key={item.itemId}>
                              <TableCell>{item.itemId}</TableCell>
                              <TableCell>{requestItem.name}</TableCell>
                              <TableCell className="text-right">{requestItem.quantity}</TableCell>
                              <TableCell className="text-right">{item.unitPrice.toLocaleString()}円</TableCell>
                              <TableCell className="text-right">{item.amount.toLocaleString()}円</TableCell>
                              <TableCell>{item.note}</TableCell>
                            </TableRow>
                          ) : null
                        })}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-bold">
                            合計
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {vendor.totalAmount.toLocaleString()}円
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div>
                      <Label className="text-sm text-gray-500">備考</Label>
                      <div className="font-medium">{vendor.note}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    見積回答はまだ入力されていません。「回答入力」ボタンをクリックして入力してください。
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={goToVendorDecision}>発注業者選定へ進む</Button>
        </CardFooter>
      </Card>

      {/* 見積回答入力ダイアログ */}
      {editingVendor && (
        <Dialog open={!!editingVendorId} onOpenChange={(open) => !open && cancelEditing()}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>見積回答入力 - {editingVendor.name}</DialogTitle>
              <DialogDescription>取引先からの見積回答情報を入力してください。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quotationNo">見積番号</Label>
                  <Input
                    id="quotationNo"
                    value={editingVendor.quotationNo}
                    onChange={(e) => setEditingVendor({ ...editingVendor, quotationNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotationDate">見積日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingVendor.quotationDate && "text-muted-foreground",
                        )}
                      >
                        {editingVendor.quotationDate ? (
                          format(editingVendor.quotationDate, "yyyy年MM月dd日", { locale: ja })
                        ) : (
                          <span>日付を選択</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingVendor.quotationDate}
                        onSelect={(date) => setEditingVendor({ ...editingVendor, quotationDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">納期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingVendor.deliveryDate && "text-muted-foreground",
                        )}
                      >
                        {editingVendor.deliveryDate ? (
                          format(editingVendor.deliveryDate, "yyyy年MM月dd日", { locale: ja })
                        ) : (
                          <span>日付を選択</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingVendor.deliveryDate}
                        onSelect={(date) => setEditingVendor({ ...editingVendor, deliveryDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">有効期限</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingVendor.validUntil && "text-muted-foreground",
                        )}
                      >
                        {editingVendor.validUntil ? (
                          format(editingVendor.validUntil, "yyyy年MM月dd日", { locale: ja })
                        ) : (
                          <span>日付を選択</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editingVendor.validUntil}
                        onSelect={(date) => setEditingVendor({ ...editingVendor, validUntil: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">見積明細</Label>
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>品目</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">単価</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead>備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editingVendor.items.map((item: any) => {
                      const requestItem = requestData.items.find((ri) => ri.id === item.itemId)
                      return requestItem ? (
                        <TableRow key={item.itemId}>
                          <TableCell>{item.itemId}</TableCell>
                          <TableCell>{requestItem.name}</TableCell>
                          <TableCell className="text-right">{requestItem.quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItemUnitPrice(item.itemId, Number(e.target.value))}
                              className="text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">{item.amount.toLocaleString()}円</TableCell>
                          <TableCell>
                            <Input
                              value={item.note}
                              onChange={(e) => updateItemNote(item.itemId, e.target.value)}
                              placeholder="備考"
                            />
                          </TableCell>
                        </TableRow>
                      ) : null
                    })}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        合計
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {editingVendor.items.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}
                        円
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">備考</Label>
                <Textarea
                  id="note"
                  value={editingVendor.note}
                  onChange={(e) => setEditingVendor({ ...editingVendor, note: e.target.value })}
                  placeholder="送料、保証、支払条件などの備考"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={cancelEditing}>
                キャンセル
              </Button>
              <Button onClick={saveEditing}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 保存成功ダイアログ */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>見積回答の保存が完了しました</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-full bg-green-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-center">見積回答情報が正常に保存されました。</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
