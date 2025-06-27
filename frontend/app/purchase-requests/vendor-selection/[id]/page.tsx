"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Check, Download, FileText, Mail, Printer, Search } from "lucide-react"

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

// 取引先のサンプルデータ
const vendors = [
  {
    id: "V001",
    name: "株式会社テクノソリューション",
    contact: "山田太郎",
    email: "yamada@techno-solution.co.jp",
    phone: "03-1234-5678",
    category: "IT機器",
    rating: 5,
  },
  {
    id: "V002",
    name: "オフィスサプライ株式会社",
    contact: "佐藤花子",
    email: "sato@office-supply.co.jp",
    phone: "03-2345-6789",
    category: "オフィス用品",
    rating: 4,
  },
  {
    id: "V003",
    name: "デジタルデバイス株式会社",
    contact: "鈴木一郎",
    email: "suzuki@digital-device.co.jp",
    phone: "03-3456-7890",
    category: "IT機器",
    rating: 3,
  },
  {
    id: "V004",
    name: "ビジネスサポート株式会社",
    contact: "高橋次郎",
    email: "takahashi@biz-support.co.jp",
    phone: "03-4567-8901",
    category: "オフィス用品",
    rating: 4,
  },
  {
    id: "V005",
    name: "ITソリューションズ株式会社",
    contact: "伊藤三郎",
    email: "ito@it-solutions.co.jp",
    phone: "03-5678-9012",
    category: "IT機器",
    rating: 5,
  },
  {
    id: "V006",
    name: "オフィスマート株式会社",
    contact: "渡辺恵子",
    email: "watanabe@office-mart.co.jp",
    phone: "03-6789-0123",
    category: "オフィス用品",
    rating: 3,
  },
  {
    id: "V007",
    name: "テクノハブ株式会社",
    contact: "中村洋一",
    email: "nakamura@techno-hub.co.jp",
    phone: "03-7890-1234",
    category: "IT機器",
    rating: 4,
  },
  {
    id: "V008",
    name: "ステーショナリーワールド株式会社",
    contact: "小林幸子",
    email: "kobayashi@stationery-world.co.jp",
    phone: "03-8901-2345",
    category: "オフィス用品",
    rating: 5,
  },
]

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

export default function VendorSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  // 発注依頼データを取得
  const requestData = purchaseRequestsData[requestId as keyof typeof purchaseRequestsData]

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("vendors")
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // 取引先のフィルタリング
  const filteredVendors = vendors.filter((vendor) => {
    // 検索語句フィルター
    const matchesSearch =
      searchTerm === "" ||
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())

    // カテゴリフィルター
    const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // 選択状態の切り替え
  const toggleVendorSelection = (id: string) => {
    setSelectedVendors((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // すべて選択/解除
  const toggleSelectAll = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([])
    } else {
      setSelectedVendors(filteredVendors.map((vendor) => vendor.id))
    }
  }

  // 見積依頼書発行処理
  const handleIssueQuotationRequest = () => {
    // 実際の処理はここに実装
    setShowSuccessDialog(true)
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
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">業者選定 - 見積依頼</h1>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="vendors">取引先選定</TabsTrigger>
          <TabsTrigger value="preview" disabled={selectedVendors.length === 0}>
            見積依頼書プレビュー
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>検索条件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">検索</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="取引先名、担当者名など"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="IT機器">IT機器</SelectItem>
                      <SelectItem value="オフィス用品">オフィス用品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedVendors.length === filteredVendors.length && filteredVendors.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>取引先コード</TableHead>
                    <TableHead>取引先名</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>電話番号</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>評価</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        該当する取引先がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id} className={selectedVendors.includes(vendor.id) ? "bg-blue-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedVendors.includes(vendor.id)}
                            onCheckedChange={() => toggleVendorSelection(vendor.id)}
                          />
                        </TableCell>
                        <TableCell>{vendor.id}</TableCell>
                        <TableCell>{vendor.name}</TableCell>
                        <TableCell>{vendor.contact}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.phone}</TableCell>
                        <TableCell>{vendor.category}</TableCell>
                        <TableCell>{renderRating(vendor.rating)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleBack}>
              キャンセル
            </Button>
            <Button onClick={() => setActiveTab("preview")} disabled={selectedVendors.length === 0}>
              <FileText className="mr-2 h-4 w-4" />
              プレビュー
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>見積依頼書プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border p-6 rounded-md mb-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">見積依頼書</h2>
                </div>

                <div className="mb-6">
                  <div className="text-right mb-4">
                    <p>{format(new Date(), "yyyy年MM月dd日", { locale: ja })}</p>
                  </div>

                  <div className="mb-4">
                    {selectedVendors.map((id) => {
                      const vendor = vendors.find((v) => v.id === id)
                      return vendor ? (
                        <div key={vendor.id} className="mb-2">
                          <p className="font-bold">{vendor.name}</p>
                          <p>{vendor.contact} 様</p>
                        </div>
                      ) : null
                    })}
                  </div>

                  <div>
                    <p className="font-bold">株式会社サンプル商事</p>
                    <p>購買部</p>
                    <p>担当: 山田太郎</p>
                    <p>TEL: 03-1234-5678</p>
                    <p>Email: yamada@sample-corp.co.jp</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-4">
                    平素は格別のご高配を賜り、厚く御礼申し上げます。
                    <br />
                    下記の通り見積依頼申し上げますので、ご検討の上ご回答いただきますようお願い申し上げます。
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p>
                        <span className="font-bold">件名：</span>
                        {requestData.title}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-bold">依頼番号：</span>
                        {requestData.id}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-bold">希望納期：</span>
                        {format(requestData.desiredDeliveryDate, "yyyy年MM月dd日", { locale: ja })}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-bold">見積期限：</span>
                        {format(new Date(new Date().setDate(new Date().getDate() + 7)), "yyyy年MM月dd日", {
                          locale: ja,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>品目</TableHead>
                        <TableHead>仕様</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead>単位</TableHead>
                        <TableHead className="text-right">単価</TableHead>
                        <TableHead className="text-right">金額</TableHead>
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
                          <TableCell className="text-right"></TableCell>
                          <TableCell className="text-right"></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">備考</h3>
                  <ul className="list-disc pl-5">
                    <li>見積書には消費税を含めた金額をご記入ください。</li>
                    <li>納期についても併せてご回答ください。</li>
                    <li>見積有効期限は1ヶ月以上としてください。</li>
                    <li>ご不明な点がございましたら、担当者までお問い合わせください。</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("vendors")}>
                  戻る
                </Button>
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  印刷
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  PDFダウンロード
                </Button>
                <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={handleIssueQuotationRequest}>
                      <Mail className="mr-2 h-4 w-4" />
                      見積依頼書発行
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>見積依頼書発行完了</DialogTitle>
                      <DialogDescription>選択された取引先に見積依頼書が発行されました。</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="rounded-full bg-green-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-center mb-2">以下の取引先に見積依頼書が発行されました：</p>
                      <ul className="list-disc pl-6">
                        {selectedVendors.map((id) => {
                          const vendor = vendors.find((v) => v.id === id)
                          return vendor ? <li key={vendor.id}>{vendor.name}</li> : null
                        })}
                      </ul>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          setShowSuccessDialog(false)
                          router.push("/purchase-requests")
                        }}
                      >
                        一覧に戻る
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
