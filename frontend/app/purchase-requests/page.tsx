"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, FileText, Plus, Search, Users, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

// サンプルデータ
const purchaseRequests = [
  {
    id: "PR-2023-0123",
    title: "開発用PCの購入",
    requester: "鈴木 大輔",
    department: "開発部",
    requestDate: new Date(2023, 10, 15),
    desiredDeliveryDate: new Date(2023, 11, 15),
    status: "pending",
    amount: 350000,
    quotationStatus: "received", // none, requested, received
  },
  {
    id: "PR-2023-0122",
    title: "オフィス備品の補充",
    requester: "佐藤 美咲",
    department: "総務部",
    requestDate: new Date(2023, 10, 14),
    desiredDeliveryDate: new Date(2023, 11, 10),
    status: "approved",
    amount: 85000,
    quotationStatus: "received",
  },
  {
    id: "PR-2023-0121",
    title: "サーバーラック増設",
    requester: "田中 健太",
    department: "IT部",
    requestDate: new Date(2023, 10, 12),
    desiredDeliveryDate: new Date(2023, 11, 20),
    status: "rejected",
    amount: 450000,
    quotationStatus: "none",
  },
  {
    id: "PR-2023-0120",
    title: "会議室用プロジェクター",
    requester: "高橋 直子",
    department: "営業部",
    requestDate: new Date(2023, 10, 10),
    desiredDeliveryDate: new Date(2023, 11, 5),
    status: "draft",
    amount: 120000,
    quotationStatus: "none",
  },
  {
    id: "PR-2023-0119",
    title: "開発環境用ソフトウェアライセンス",
    requester: "鈴木 大輔",
    department: "開発部",
    requestDate: new Date(2023, 10, 8),
    desiredDeliveryDate: new Date(2023, 11, 1),
    status: "approved",
    amount: 280000,
    quotationStatus: "requested",
  },
  {
    id: "PR-2023-0118",
    title: "営業部用タブレット端末",
    requester: "山田 隆",
    department: "営業部",
    requestDate: new Date(2023, 10, 7),
    desiredDeliveryDate: new Date(2023, 10, 28),
    status: "approved",
    amount: 420000,
    quotationStatus: "requested",
  },
  {
    id: "PR-2023-0117",
    title: "社内イベント用備品",
    requester: "中村 優子",
    department: "人事部",
    requestDate: new Date(2023, 10, 5),
    desiredDeliveryDate: new Date(2023, 11, 25),
    status: "pending",
    amount: 150000,
    quotationStatus: "none",
  },
  {
    id: "PR-2023-0116",
    title: "セキュリティソフトウェア更新",
    requester: "伊藤 誠",
    department: "IT部",
    requestDate: new Date(2023, 10, 3),
    desiredDeliveryDate: new Date(2023, 10, 20),
    status: "approved",
    amount: 380000,
    quotationStatus: "received",
  },
  {
    id: "PR-2023-0115",
    title: "研修用教材",
    requester: "小林 香織",
    department: "人事部",
    requestDate: new Date(2023, 10, 1),
    desiredDeliveryDate: new Date(2023, 10, 15),
    status: "approved",
    amount: 75000,
    quotationStatus: "received",
  },
  {
    id: "PR-2023-0114",
    title: "社内ネットワーク機器更新",
    requester: "伊藤 誠",
    department: "IT部",
    requestDate: new Date(2023, 9, 28),
    desiredDeliveryDate: new Date(2023, 10, 25),
    status: "pending",
    amount: 620000,
    quotationStatus: "none",
  },
  {
    id: "PR-2023-0113",
    title: "マーケティング資料印刷",
    requester: "山田 隆",
    department: "営業部",
    requestDate: new Date(2023, 9, 25),
    desiredDeliveryDate: new Date(2023, 10, 10),
    status: "approved",
    amount: 95000,
    quotationStatus: "received",
  },
  {
    id: "PR-2023-0112",
    title: "オフィスチェア交換",
    requester: "佐藤 美咲",
    department: "総務部",
    requestDate: new Date(2023, 9, 22),
    desiredDeliveryDate: new Date(2023, 10, 15),
    status: "approved",
    amount: 180000,
    quotationStatus: "received",
  },
  {
    id: "PR-2023-0111",
    title: "開発サーバー増強",
    requester: "鈴木 大輔",
    department: "開発部",
    requestDate: new Date(2023, 9, 20),
    desiredDeliveryDate: new Date(2023, 10, 20),
    status: "rejected",
    amount: 850000,
    quotationStatus: "none",
  },
  {
    id: "PR-2023-0110",
    title: "社内報用カメラ機材",
    requester: "中村 優子",
    department: "人事部",
    requestDate: new Date(2023, 9, 18),
    desiredDeliveryDate: new Date(2023, 10, 5),
    status: "draft",
    amount: 135000,
    quotationStatus: "none",
  },
  {
    id: "PR-2023-0109",
    title: "顧客向けノベルティグッズ",
    requester: "山田 隆",
    department: "営業部",
    requestDate: new Date(2023, 9, 15),
    desiredDeliveryDate: new Date(2023, 10, 10),
    status: "approved",
    amount: 250000,
    quotationStatus: "received",
  },
]

// ステータスに応じたバッジを表示する関数
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

// 見積ステータスに応じたバッジを表示する関数
const renderQuotationStatusBadge = (status: string) => {
  switch (status) {
    case "none":
      return <Badge variant="outline">未依頼</Badge>
    case "requested":
      return <Badge variant="secondary">依頼中</Badge>
    case "received":
      return (
        <Badge variant="success" className="bg-green-100 text-green-800">
          回答済
        </Badge>
      )
    default:
      return <Badge variant="outline">未依頼</Badge>
  }
}

export default function PurchaseRequestsPage() {
  const router = useRouter()
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [quotationStatusFilter, setQuotationStatusFilter] = useState<string>("all")
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])

  // フィルタリングされた発注依頼リスト
  const filteredRequests = purchaseRequests.filter((request) => {
    // 日付フィルター
    const dateInRange = (!startDate || request.requestDate >= startDate) && (!endDate || request.requestDate <= endDate)

    // 検索語句フィルター
    const matchesSearch =
      searchTerm === "" ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase())

    // ステータスフィルター
    const matchesStatus = statusFilter === "all" || request.status === statusFilter

    // 見積ステータスフィルター
    const matchesQuotationStatus = quotationStatusFilter === "all" || request.quotationStatus === quotationStatusFilter

    return dateInRange && matchesSearch && matchesStatus && matchesQuotationStatus
  })

  // 選択状態の切り替え
  const toggleRequestSelection = (id: string) => {
    setSelectedRequests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // すべて選択/解除
  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(filteredRequests.map((req) => req.id))
    }
  }

  // 業者選定画面へ遷移
  const handleVendorSelection = () => {
    if (selectedRequests.length > 0) {
      // 選択された最初の依頼IDを使用（複数選択の場合は最初のものだけ）
      router.push(`/purchase-requests/vendor-selection/${selectedRequests[0]}`)
    }
  }

  // 見積回答入力画面へ遷移
  const handleQuotationResponses = () => {
    if (selectedRequests.length > 0) {
      router.push(`/purchase-requests/quotation-responses/${selectedRequests[0]}`)
    }
  }

  // 発注業者選定画面へ遷移
  const handleVendorDecision = () => {
    if (selectedRequests.length > 0) {
      router.push(`/purchase-requests/vendor-decision/${selectedRequests[0]}`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">発注依頼一覧</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleVendorSelection} disabled={selectedRequests.length === 0}>
            <Users className="mr-2 h-4 w-4" />
            業者選定
          </Button>
          <Button variant="outline" onClick={handleQuotationResponses} disabled={selectedRequests.length === 0}>
            <ClipboardList className="mr-2 h-4 w-4" />
            見積回答入力
          </Button>
          <Button onClick={handleVendorDecision} disabled={selectedRequests.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            発注業者選定
          </Button>
          <Button asChild>
            <a href="/purchase-requests/new">
              <Plus className="mr-2 h-4 w-4" />
              新規依頼
            </a>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">申請日（開始）</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    {startDate ? format(startDate, "yyyy年MM月dd日", { locale: ja }) : <span>日付を選択</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">申請日（終了）</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    {endDate ? format(endDate, "yyyy年MM月dd日", { locale: ja }) : <span>日付を選択</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="pending">申請中</SelectItem>
                  <SelectItem value="approved">承認済</SelectItem>
                  <SelectItem value="rejected">却下</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotationStatus">見積ステータス</Label>
              <Select value={quotationStatusFilter} onValueChange={setQuotationStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="none">未依頼</SelectItem>
                  <SelectItem value="requested">依頼中</SelectItem>
                  <SelectItem value="received">回答済</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="search">検索</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="依頼番号、件名、申請者など"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>依頼番号</TableHead>
                <TableHead>件名</TableHead>
                <TableHead>申請者</TableHead>
                <TableHead>部門</TableHead>
                <TableHead>申請日</TableHead>
                <TableHead>希望納期</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>見積状況</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead className="text-center">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
                    該当する発注依頼がありません
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} className={selectedRequests.includes(request.id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRequests.includes(request.id)}
                        onCheckedChange={() => toggleRequestSelection(request.id)}
                      />
                    </TableCell>
                    <TableCell>{request.id}</TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.requester}</TableCell>
                    <TableCell>{request.department}</TableCell>
                    <TableCell>{format(request.requestDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>{format(request.desiredDeliveryDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>{renderStatusBadge(request.status)}</TableCell>
                    <TableCell>{renderQuotationStatusBadge(request.quotationStatus)}</TableCell>
                    <TableCell className="text-right">{request.amount.toLocaleString()}円</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/purchase-requests/${request.id}`}>
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
