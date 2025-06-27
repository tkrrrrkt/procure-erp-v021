"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  ShoppingCart,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// サンプルデータ
const orderStats = {
  total: 245,
  draft: 12,
  pending: 28,
  approved: 156,
  rejected: 8,
  completed: 41,
  totalAmount: 24580000,
  thisMonth: 3250000,
  lastMonth: 2980000,
}

const receivingStats = {
  total: 198,
  pending: 15,
  completed: 183,
  totalAmount: 21450000,
  thisMonth: 2850000,
  lastMonth: 2650000,
}

const invoiceMatchingStats = {
  total: 175,
  matched: 120,
  partialMatch: 35,
  mismatch: 20,
  pending: 45,
}

const recentOrders = [
  {
    id: "1",
    orderNumber: "PO-2023-0459",
    orderDate: new Date(2023, 11, 15),
    vendorName: "株式会社山田製作所",
    orderType: "regular",
    status: "approved",
    totalAmount: 16500,
  },
  {
    id: "2",
    orderNumber: "PO-2023-0458",
    orderDate: new Date(2023, 11, 14),
    vendorName: "大阪金属工業株式会社",
    orderType: "urgent",
    status: "completed",
    totalAmount: 45000,
  },
  {
    id: "3",
    orderNumber: "PO-2023-0457",
    orderDate: new Date(2023, 11, 13),
    vendorName: "東京電子工業株式会社",
    orderType: "planned",
    status: "pending",
    totalAmount: 120000,
  },
  {
    id: "4",
    orderNumber: "PO-2023-0456",
    orderDate: new Date(2023, 11, 10),
    vendorName: "福岡精密機器株式会社",
    orderType: "regular",
    status: "rejected",
    totalAmount: 78500,
  },
]

const recentReceivings = [
  {
    id: "1",
    receivingNumber: "RCV-2023-0459",
    receivingDate: new Date(2023, 11, 15),
    vendorName: "株式会社山田製作所",
    status: "completed",
    totalAmount: 16500,
  },
  {
    id: "2",
    receivingNumber: "RCV-2023-0458",
    receivingDate: new Date(2023, 11, 14),
    vendorName: "大阪金属工業株式会社",
    status: "completed",
    totalAmount: 45000,
  },
  {
    id: "3",
    receivingNumber: "RCV-2023-0457",
    receivingDate: new Date(2023, 11, 13),
    vendorName: "東京電子工業株式会社",
    status: "pending",
    totalAmount: 120000,
  },
]

const pendingApprovals = [
  {
    id: "3",
    orderNumber: "PO-2023-0457",
    orderDate: new Date(2023, 11, 13),
    vendorName: "東京電子工業株式会社",
    department: "開発部",
    requestedBy: "鈴木 大輔",
    totalAmount: 120000,
  },
  {
    id: "7",
    orderNumber: "PO-2023-0453",
    orderDate: new Date(2023, 11, 1),
    vendorName: "仙台金属加工株式会社",
    department: "製造部",
    requestedBy: "田中 健太",
    totalAmount: 65000,
  },
  {
    id: "9",
    orderNumber: "PO-2023-0451",
    orderDate: new Date(2023, 10, 25),
    vendorName: "名古屋機械工業株式会社",
    department: "製造部",
    requestedBy: "高橋 直子",
    totalAmount: 42000,
  },
]

const notifications = [
  {
    id: "1",
    type: "deadline",
    message: "発注書 #PO-2023-0458 の納期が3日後に迫っています",
    date: new Date(2023, 11, 14),
  },
  {
    id: "2",
    type: "approval",
    message: "発注書 #PO-2023-0457 が承認待ちです",
    date: new Date(2023, 11, 13),
  },
  {
    id: "3",
    type: "invoice",
    message: "請求書 #INV-20231217-002 のマッチングに不一致があります",
    date: new Date(2023, 11, 12),
  },
  {
    id: "4",
    type: "receiving",
    message: "仕入 #RCV-2023-0457 が未処理です",
    date: new Date(2023, 11, 11),
  },
]

// ステータスに対応するラベルとカラー
const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-200 text-gray-800" },
  pending: { label: "承認待ち", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済", color: "bg-green-100 text-green-800" },
  rejected: { label: "却下", color: "bg-red-100 text-red-800" },
  completed: { label: "完了", color: "bg-blue-100 text-blue-800" },
  canceled: { label: "キャンセル", color: "bg-gray-100 text-gray-800" },
  matched: { label: "一致", color: "bg-green-100 text-green-800" },
  partial_match: { label: "部分一致", color: "bg-yellow-100 text-yellow-800" },
  mismatch: { label: "不一致", color: "bg-red-100 text-red-800" },
}

// 通知タイプに対応するアイコンとカラー
const notificationConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  deadline: { icon: <Clock className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
  approval: { icon: <CheckCircle className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  invoice: { icon: <FileText className="h-4 w-4" />, color: "bg-red-100 text-red-800" },
  receiving: { icon: <Truck className="h-4 w-4" />, color: "bg-purple-100 text-purple-800" },
}

// 月別データ（グラフ用）
const monthlyData = [
  { month: "1月", orders: 1850000, receivings: 1750000 },
  { month: "2月", orders: 2100000, receivings: 1950000 },
  { month: "3月", orders: 2350000, receivings: 2200000 },
  { month: "4月", orders: 1950000, receivings: 1850000 },
  { month: "5月", orders: 2250000, receivings: 2100000 },
  { month: "6月", orders: 2450000, receivings: 2300000 },
  { month: "7月", orders: 2150000, receivings: 2050000 },
  { month: "8月", orders: 2050000, receivings: 1950000 },
  { month: "9月", orders: 2350000, receivings: 2250000 },
  { month: "10月", orders: 2650000, receivings: 2550000 },
  { month: "11月", orders: 2980000, receivings: 2650000 },
  { month: "12月", orders: 3250000, receivings: 2850000 },
]

// 仕入先別データ（グラフ用）
const vendorData = [
  { name: "株式会社山田製作所", amount: 5250000 },
  { name: "東京電子工業株式会社", amount: 4850000 },
  { name: "大阪金属工業株式会社", amount: 3950000 },
  { name: "名古屋機械工業株式会社", amount: 3650000 },
  { name: "福岡精密機器株式会社", amount: 2850000 },
  { name: "その他", amount: 4030000 },
]

// 部門別データ（グラフ用）
const departmentData = [
  { name: "製造部", amount: 12500000 },
  { name: "開発部", amount: 6800000 },
  { name: "営業部", amount: 3200000 },
  { name: "総務部", amount: 2080000 },
]

export default function DashboardPage() {
  const [period, setPeriod] = useState("month")

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="期間" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">今週</SelectItem>
              <SelectItem value="month">今月</SelectItem>
              <SelectItem value="quarter">今四半期</SelectItem>
              <SelectItem value="year">今年</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="orders">発注</TabsTrigger>
          <TabsTrigger value="receiving">仕入</TabsTrigger>
          <TabsTrigger value="invoices">請求書照合</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 概要統計 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">発注金額（今月）</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{orderStats.thisMonth.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  前月比 {Math.round((orderStats.thisMonth / orderStats.lastMonth - 1) * 100)}%
                </p>
                <Progress
                  value={Math.round((orderStats.thisMonth / orderStats.lastMonth) * 100)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">仕入金額（今月）</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{receivingStats.thisMonth.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  前月比 {Math.round((receivingStats.thisMonth / receivingStats.lastMonth - 1) * 100)}%
                </p>
                <Progress
                  value={Math.round((receivingStats.thisMonth / receivingStats.lastMonth) * 100)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">承認待ち発注</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.pending}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((orderStats.pending / orderStats.total) * 100)}%
                </p>
                <Progress value={Math.round((orderStats.pending / orderStats.total) * 100)} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">未処理請求書照合</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceMatchingStats.pending}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((invoiceMatchingStats.pending / invoiceMatchingStats.total) * 100)}%
                </p>
                <Progress
                  value={Math.round((invoiceMatchingStats.pending / invoiceMatchingStats.total) * 100)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* クイックアクション */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button asChild className="h-20 flex flex-col items-center justify-center">
                  <Link href="/purchase-orders/new">
                    <Plus className="h-5 w-5 mb-1" />
                    <span>発注入力</span>
                  </Link>
                </Button>
                <Button asChild className="h-20 flex flex-col items-center justify-center">
                  <Link href="/receiving/new">
                    <Plus className="h-5 w-5 mb-1" />
                    <span>仕入入力</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Link href="/purchase-orders/issue">
                    <FileText className="h-5 w-5 mb-1" />
                    <span>注文書発行</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Link href="/invoice-matching/list">
                    <FileText className="h-5 w-5 mb-1" />
                    <span>請求書照合</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* 通知 */}
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">最新の通知</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center">
                        <div className={`${notificationConfig[notification.type].color} p-2 rounded-full mr-3`}>
                          {notificationConfig[notification.type].icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(notification.date, "yyyy年MM月dd日", { locale: ja })}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* グラフ */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">月別金額推移</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col justify-between">
                  <div className="flex-1 flex items-end space-x-2">
                    {monthlyData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center space-y-1">
                          <div
                            className="w-full bg-primary/80 rounded-t"
                            style={{
                              height: `${(data.orders / 3500000) * 200}px`,
                            }}
                          ></div>
                          <div
                            className="w-full bg-primary/40 rounded-t"
                            style={{
                              height: `${(data.receivings / 3500000) * 200}px`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs mt-2">{data.month}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4 space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary/80 rounded mr-1"></div>
                      <span className="text-xs">発注</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary/40 rounded mr-1"></div>
                      <span className="text-xs">仕入</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">仕入先別発注金額</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <div className="flex flex-col space-y-3">
                    {vendorData.map((vendor, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{vendor.name}</span>
                          <span>¥{vendor.amount.toLocaleString()}</span>
                        </div>
                        <Progress
                          value={Math.round((vendor.amount / orderStats.totalAmount) * 100)}
                          className="h-2"
                          indicatorClassName={`bg-primary/${100 - index * 10}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 承認待ち発注 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">承認待ち発注</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
                  <TableRow>
                    <TableHead>発注番号</TableHead>
                    <TableHead>発注日</TableHead>
                    <TableHead>取引先</TableHead>
                    <TableHead>部門</TableHead>
                    <TableHead>申請者</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{format(order.orderDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                      <TableCell>{order.vendorName}</TableCell>
                      <TableCell>{order.department}</TableCell>
                      <TableCell>{order.requestedBy}</TableCell>
                      <TableCell className="text-right">¥{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/purchase-orders/${order.id}`}>詳細</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link href="/purchase-orders?status=pending">
                  すべての承認待ち発注を表示
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {/* 発注統計 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">発注総数</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.total}件</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">発注総額</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{orderStats.totalAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">承認済発注</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.approved}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((orderStats.approved / orderStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完了発注</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.completed}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((orderStats.completed / orderStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 発注ステータス分布 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">発注ステータス分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>下書き</span>
                    <span>{orderStats.draft}件</span>
                  </div>
                  <Progress value={(orderStats.draft / orderStats.total) * 100} className="h-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>承認待ち</span>
                    <span>{orderStats.pending}件</span>
                  </div>
                  <Progress value={(orderStats.pending / orderStats.total) * 100} className="h-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>承認済</span>
                    <span>{orderStats.approved}件</span>
                  </div>
                  <Progress value={(orderStats.approved / orderStats.total) * 100} className="h-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>完了</span>
                    <span>{orderStats.completed}件</span>
                  </div>
                  <Progress value={(orderStats.completed / orderStats.total) * 100} className="h-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>却下</span>
                    <span>{orderStats.rejected}件</span>
                  </div>
                  <Progress value={(orderStats.rejected / orderStats.total) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 部門別発注金額 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">部門別発注金額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <div className="flex flex-col space-y-3">
                  {departmentData.map((dept, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{dept.name}</span>
                        <span>¥{dept.amount.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={Math.round((dept.amount / orderStats.totalAmount) * 100)}
                        className="h-2"
                        indicatorClassName={`bg-primary/${100 - index * 15}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 最近の発注 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">最近の発注</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
                  <TableRow>
                    <TableHead>発注番号</TableHead>
                    <TableHead>発注日</TableHead>
                    <TableHead>取引先</TableHead>
                    <TableHead>発注形態</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{format(order.orderDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                      <TableCell>{order.vendorName}</TableCell>
                      <TableCell>{order.orderType}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[order.status].color}>{statusConfig[order.status].label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">¥{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/purchase-orders/${order.id}`}>詳細</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link href="/purchase-orders">
                  すべての発注を表示
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="receiving" className="space-y-4">
          {/* 仕入統計 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">仕入総数</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{receivingStats.total}件</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">仕入総額</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{receivingStats.totalAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">未処理仕入</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{receivingStats.pending}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((receivingStats.pending / receivingStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完了仕入</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{receivingStats.completed}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((receivingStats.completed / receivingStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 月別仕入金額推移 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">月別仕入金額推移</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col justify-between">
                <div className="flex-1 flex items-end space-x-2">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center space-y-1">
                        <div
                          className="w-full bg-primary/40 rounded-t"
                          style={{
                            height: `${(data.receivings / 3500000) * 200}px`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs mt-2">{data.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 最近の仕入 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">最近の仕入</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
                  <TableRow>
                    <TableHead>仕入番号</TableHead>
                    <TableHead>仕入日</TableHead>
                    <TableHead>取引先</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReceivings.map((receiving) => (
                    <TableRow key={receiving.id}>
                      <TableCell className="font-medium">{receiving.receivingNumber}</TableCell>
                      <TableCell>{format(receiving.receivingDate, "yyyy/MM/dd", { locale: ja })}</TableCell>
                      <TableCell>{receiving.vendorName}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig[receiving.status].color}>
                          {statusConfig[receiving.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">¥{receiving.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/receiving/${receiving.id}`}>詳細</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link href="/receiving">
                  すべての仕入を表示
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {/* 請求書照合統計 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">照合総数</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceMatchingStats.total}件</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">完全一致</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceMatchingStats.matched}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((invoiceMatchingStats.matched / invoiceMatchingStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">部分一致</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceMatchingStats.partialMatch}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((invoiceMatchingStats.partialMatch / invoiceMatchingStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">不一致</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoiceMatchingStats.mismatch}件</div>
                <p className="text-xs text-muted-foreground">
                  全体の{Math.round((invoiceMatchingStats.mismatch / invoiceMatchingStats.total) * 100)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 請求書照合ステータス分布 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">請求書照合ステータス分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>完全一致</span>
                    <span>{invoiceMatchingStats.matched}件</span>
                  </div>
                  <Progress
                    value={(invoiceMatchingStats.matched / invoiceMatchingStats.total) * 100}
                    className="h-2"
                    indicatorClassName="bg-green-500"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>部分一致</span>
                    <span>{invoiceMatchingStats.partialMatch}件</span>
                  </div>
                  <Progress
                    value={(invoiceMatchingStats.partialMatch / invoiceMatchingStats.total) * 100}
                    className="h-2"
                    indicatorClassName="bg-yellow-500"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>不一致</span>
                    <span>{invoiceMatchingStats.mismatch}件</span>
                  </div>
                  <Progress
                    value={(invoiceMatchingStats.mismatch / invoiceMatchingStats.total) * 100}
                    className="h-2"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 未処理の請求書照合 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">未処理の請求書照合</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>注意</AlertTitle>
                <AlertDescription>
                  {invoiceMatchingStats.pending}件の未処理の請求書照合があります。早急に処理してください。
                </AlertDescription>
              </Alert>
              <Button className="w-full" asChild>
                <Link href="/invoice-matching/list">
                  請求書照合一覧を表示
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
