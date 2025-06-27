"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Check, FileText, ShoppingCart } from "lucide-react"

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

// 見積回答のサンプルデータ
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

export default function VendorDecisionPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  // 発注依頼データを取得
  const requestData = purchaseRequestsData[requestId as keyof typeof purchaseRequestsData]
  const vendorData = quotationVendors[requestId as keyof typeof quotationVendors] || []

  const [selectedVendorId, setSelectedVendorId] = useState<string>("")
  const [decisionReason, setDecisionReason] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("comparison")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // 選択された業者の詳細データを取得
  const selectedVendor = vendorData.find((v) => v.id === selectedVendorId)

  // 発注データを作成
  const createPurchaseOrder = () => {
    if (!selectedVendor) return

    // 実際のAPIリクエストはここに実装
    // 今回はモックデータの更新のみ

    setShowSuccessDialog(true)
  }

  // 一覧画面に戻る
  const handleBack = () => {
    router.push("/purchase-requests")
  }

  // 発注入力画面に遷移
  const goToPurchaseOrderEntry = () => {
    router.push("/purchase-orders/new")
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
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">発注業者選定</h1>
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
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="comparison">見積比較</TabsTrigger>
          <TabsTrigger value="selected" disabled={!selectedVendorId}>
            選定業者詳細
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>見積回答比較</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
                    <TableRow>
                      <TableHead className="w-[50px]">選択</TableHead>
                      <TableHead>業者名</TableHead>
                      <TableHead>評価</TableHead>
                      <TableHead>見積番号</TableHead>
                      <TableHead>見積日</TableHead>
                      <TableHead>納期</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead>備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                          見積回答がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendorData.map((vendor) => (
                        <TableRow key={vendor.id} className={selectedVendorId === vendor.id ? "bg-blue-50" : ""}>
                          <TableCell>
                            <RadioGroup value={selectedVendorId} onValueChange={setSelectedVendorId}>
                              <RadioGroupItem value={vendor.id} id={`vendor-${vendor.id}`} />
                            </RadioGroup>
                          </TableCell>
                          <TableCell>{vendor.name}</TableCell>
                          <TableCell>{renderRating(vendor.rating)}</TableCell>
                          <TableCell>{vendor.quotationNo}</TableCell>
                          <TableCell>{format(vendor.quotationDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                          <TableCell>{format(vendor.deliveryDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                          <TableCell className="text-right">{vendor.totalAmount.toLocaleString()}円</TableCell>
                          <TableCell>{vendor.note}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="decisionReason">選定理由</Label>
                  <Textarea
                    id="decisionReason"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="業者選定の理由を入力してください"
                    rows={3}
                    disabled={!selectedVendorId}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleBack}>
                    キャンセル
                  </Button>
                  <Button onClick={() => setActiveTab("selected")} disabled={!selectedVendorId}>
                    <FileText className="mr-2 h-4 w-4" />
                    選定業者詳細
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selected">
          <Card>
            <CardHeader>
              <CardTitle>選定業者詳細</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVendor && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">業者名</Label>
                      <div className="font-medium">{selectedVendor.name}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">担当者</Label>
                      <div className="font-medium">{selectedVendor.contact}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">メールアドレス</Label>
                      <div className="font-medium">{selectedVendor.email}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">電話番号</Label>
                      <div className="font-medium">{selectedVendor.phone}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">見積番号</Label>
                      <div className="font-medium">{selectedVendor.quotationNo}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">見積日</Label>
                      <div className="font-medium">
                        {format(selectedVendor.quotationDate, "yyyy/MM/dd", { locale: ja })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">納期</Label>
                      <div className="font-medium">
                        {format(selectedVendor.deliveryDate, "yyyy/MM/dd", { locale: ja })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">有効期限</Label>
                      <div className="font-medium">
                        {format(selectedVendor.validUntil, "yyyy/MM/dd", { locale: ja })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500 mb-2 block">見積明細</Label>
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
                        {selectedVendor.items.map((item: any) => {
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
                            {selectedVendor.totalAmount.toLocaleString()}円
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">備考</Label>
                    <div className="font-medium">{selectedVendor.note}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">選定理由</Label>
                    <div className="font-medium">{decisionReason || "未入力"}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveTab("comparison")}>
                戻る
              </Button>
              <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogTrigger asChild>
                  <Button onClick={createPurchaseOrder}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    発注データ作成
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>発注データ作成完了</DialogTitle>
                    <DialogDescription>選定された業者の情報を基に発注データが作成されました。</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="rounded-full bg-green-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-center mb-2">以下の業者に対する発注データが作成されました：</p>
                    <p className="text-center font-bold">{selectedVendor?.name}</p>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setShowSuccessDialog(false)
                        goToPurchaseOrderEntry()
                      }}
                    >
                      発注入力画面へ
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
