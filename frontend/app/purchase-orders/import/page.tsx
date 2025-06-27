"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, FileText, Image, Table, Check, X, AlertCircle, Camera, CameraOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 発注データの型定義
interface PurchaseOrderData {
  id: string
  orderNumber: string
  orderDate: string
  vendorName: string
  vendorCode: string
  department: string
  personInCharge: string
  deliveryDate: string
  items: PurchaseOrderItem[]
  status: "mapped" | "partial" | "unmapped"
}

interface PurchaseOrderItem {
  id: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
  status: "mapped" | "unmapped"
}

// マッピング設定の型定義
interface MappingConfig {
  orderNumber: string
  orderDate: string
  vendorName: string
  vendorCode: string
  department: string
  personInCharge: string
  deliveryDate: string
  productCode: string
  productName: string
  quantity: string
  unit: string
  unitPrice: string
  amount: string
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [fileType, setFileType] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>({
    orderNumber: "",
    orderDate: "",
    vendorName: "",
    vendorCode: "",
    department: "",
    personInCharge: "",
    deliveryDate: "",
    productCode: "",
    productName: "",
    quantity: "",
    unit: "",
    unitPrice: "",
    amount: "",
  })
  const [mappingResult, setMappingResult] = useState<PurchaseOrderData[]>([])
  const [showMappingSuccess, setShowMappingSuccess] = useState(false)
  const [createdDraftOrders, setCreatedDraftOrders] = useState(0)
  const [showCreationSuccess, setShowCreationSuccess] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraAvailable, setIsCameraAvailable] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイルアップロードハンドラー
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsUploading(true)

    // ファイルタイプの判定
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      setFileType("excel")
    } else if (file.name.endsWith(".pdf")) {
      setFileType("pdf")
    } else if (file.name.endsWith(".jpg") || file.name.endsWith(".jpeg") || file.name.endsWith(".png")) {
      setFileType("image")
    } else {
      setFileType("unknown")
    }

    // アップロードの進捗をシミュレート
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsUploading(false)

        // ファイルの内容を模擬データで設定
        setFileContent(generateMockFileContent(file.name))

        // 次のタブに移動
        setTimeout(() => {
          setActiveTab("preview")
        }, 500)
      }
    }, 200)
  }

  // ファイル選択ボタンのクリックハンドラー
  const handleSelectFileClick = () => {
    fileInputRef.current?.click()
  }

  // マッピング設定の変更ハンドラー
  const handleMappingChange = (field: keyof MappingConfig, value: string) => {
    setMappingConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // マッピング実行ハンドラー
  const handleExecuteMapping = () => {
    // マッピング処理をシミュレート
    const mockMappingResult = generateMockMappingResult()
    setMappingResult(mockMappingResult)
    setShowMappingSuccess(true)
    setActiveTab("mapping-result")
  }

  // 仮発注データ作成ハンドラー
  const handleCreateDraftOrders = () => {
    // 仮発注データ作成をシミュレート
    const successCount = mappingResult.filter((order) => order.status === "mapped" || order.status === "partial").length

    setCreatedDraftOrders(successCount)
    setShowCreationSuccess(true)
  }

  // 模擬ファイル内容の生成
  const generateMockFileContent = (fileName: string) => {
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return {
        headers: [
          "注文番号",
          "注文日",
          "仕入先名",
          "仕入先コード",
          "部署",
          "担当者",
          "納期",
          "商品コード",
          "商品名",
          "数量",
          "単位",
          "単価",
          "金額",
        ],
        rows: [
          [
            "PO-2023-001",
            "2023/04/01",
            "株式会社山田商事",
            "V001",
            "購買部",
            "鈴木一郎",
            "2023/04/15",
            "P001",
            "ノートパソコン",
            "10",
            "台",
            "120000",
            "1200000",
          ],
          ["", "", "", "", "", "", "", "P002", "モニター", "10", "台", "25000", "250000"],
          [
            "PO-2023-002",
            "2023/04/02",
            "株式会社田中電機",
            "V002",
            "IT部",
            "佐藤次郎",
            "2023/04/20",
            "P003",
            "プリンター",
            "5",
            "台",
            "45000",
            "225000",
          ],
        ],
      }
    } else if (fileName.endsWith(".pdf")) {
      return {
        text: "注文書\n\n注文番号: PO-2023-003\n注文日: 2023/04/03\n仕入先: 株式会社高橋工業 (V003)\n部署: 総務部\n担当者: 高橋三郎\n納期: 2023/04/25\n\n商品コード\t商品名\t数量\t単位\t単価\t金額\nP004\tデスクトップPC\t15\t台\t100000\t1500000\nP005\tキーボード\t15\tセット\t5000\t75000",
      }
    } else {
      return {
        preview: "画像ファイルからのデータ抽出結果（OCR処理後）",
        extractedText:
          "注文書\n注文番号: PO-2023-004\n注文日: 2023/04/04\n仕入先: 株式会社伊藤商店 (V004)\n部署: 営業部\n担当者: 伊藤四郎\n納期: 2023/04/30\n\n商品コード: P006\n商品名: プロジェクター\n数量: 3\n単位: 台\n単価: 80000\n金額: 240000",
      }
    }
  }

  // 模擬マッピング結果の生成
  const generateMockMappingResult = () => {
    return [
      {
        id: "1",
        orderNumber: "PO-2023-001",
        orderDate: "2023/04/01",
        vendorName: "株式会社山田商事",
        vendorCode: "V001",
        department: "購買部",
        personInCharge: "鈴木一郎",
        deliveryDate: "2023/04/15",
        status: "mapped" as const,
        items: [
          {
            id: "1-1",
            productCode: "P001",
            productName: "ノートパソコン",
            quantity: 10,
            unit: "台",
            unitPrice: 120000,
            amount: 1200000,
            status: "mapped" as const,
          },
          {
            id: "1-2",
            productCode: "P002",
            productName: "モニター",
            quantity: 10,
            unit: "台",
            unitPrice: 25000,
            amount: 250000,
            status: "mapped" as const,
          },
        ],
      },
      {
        id: "2",
        orderNumber: "PO-2023-002",
        orderDate: "2023/04/02",
        vendorName: "株式会社田中電機",
        vendorCode: "V002",
        department: "IT部",
        personInCharge: "佐藤次郎",
        deliveryDate: "2023/04/20",
        status: "partial" as const,
        items: [
          {
            id: "2-1",
            productCode: "P003",
            productName: "プリンター",
            quantity: 5,
            unit: "台",
            unitPrice: 45000,
            amount: 225000,
            status: "mapped" as const,
          },
        ],
      },
      {
        id: "3",
        orderNumber: "PO-2023-003",
        orderDate: "2023/04/03",
        vendorName: "株式会社高橋工業",
        vendorCode: "V003",
        department: "総務部",
        personInCharge: "高橋三郎",
        deliveryDate: "2023/04/25",
        status: "unmapped" as const,
        items: [
          {
            id: "3-1",
            productCode: "P004",
            productName: "デスクトップPC",
            quantity: 15,
            unit: "台",
            unitPrice: 100000,
            amount: 1500000,
            status: "unmapped" as const,
          },
          {
            id: "3-2",
            productCode: "P005",
            productName: "キーボード",
            quantity: 15,
            unit: "セット",
            unitPrice: 5000,
            amount: 75000,
            status: "mapped" as const,
          },
        ],
      },
    ]
  }

  // ファイルプレビューの表示
  const renderFilePreview = () => {
    if (!fileContent) return null

    if (fileType === "excel") {
      return (
        <div className="border rounded-md p-4 overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-sky-50 to-blue-100">
              <tr>
                {fileContent.headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fileContent.rows.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } else if (fileType === "pdf") {
      return (
        <div className="border rounded-md p-4 bg-white">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-red-500" />
            <span className="ml-2 text-lg font-medium">PDF プレビュー</span>
          </div>
          <pre className="whitespace-pre-wrap text-sm">{fileContent.text}</pre>
        </div>
      )
    } else if (fileType === "image") {
      return (
        <div className="border rounded-md p-4 bg-white">
          <div className="flex items-center justify-center mb-4">
            <Image className="h-12 w-12 text-blue-500" />
            <span className="ml-2 text-lg font-medium">画像プレビュー</span>
          </div>
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p className="text-sm font-medium">{fileContent.preview}</p>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">{fileContent.extractedText}</pre>
        </div>
      )
    }

    return (
      <div className="border rounded-md p-4 bg-white">
        <p>このファイル形式はプレビューできません。</p>
      </div>
    )
  }

  // マッピング設定フォームの表示
  const renderMappingForm = () => {
    if (!fileContent) return null

    const columnOptions =
      fileType === "excel"
        ? fileContent.headers.map((header: string, index: number) => ({
            label: header,
            value: header,
          }))
        : [
            { label: "自動抽出", value: "auto" },
            { label: "手動入力", value: "manual" },
          ]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">ヘッダー情報のマッピング</h3>

            <div className="space-y-2">
              <Label htmlFor="orderNumber">発注番号</Label>
              <Select
                value={mappingConfig.orderNumber}
                onValueChange={(value) => handleMappingChange("orderNumber", value)}
              >
                <SelectTrigger id="orderNumber">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderDate">発注日</Label>
              <Select
                value={mappingConfig.orderDate}
                onValueChange={(value) => handleMappingChange("orderDate", value)}
              >
                <SelectTrigger id="orderDate">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorName">仕入先名</Label>
              <Select
                value={mappingConfig.vendorName}
                onValueChange={(value) => handleMappingChange("vendorName", value)}
              >
                <SelectTrigger id="vendorName">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorCode">仕入先コード</Label>
              <Select
                value={mappingConfig.vendorCode}
                onValueChange={(value) => handleMappingChange("vendorCode", value)}
              >
                <SelectTrigger id="vendorCode">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">その他のヘッダー情報</h3>

            <div className="space-y-2">
              <Label htmlFor="department">部署</Label>
              <Select
                value={mappingConfig.department}
                onValueChange={(value) => handleMappingChange("department", value)}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personInCharge">担当者</Label>
              <Select
                value={mappingConfig.personInCharge}
                onValueChange={(value) => handleMappingChange("personInCharge", value)}
              >
                <SelectTrigger id="personInCharge">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">納期</Label>
              <Select
                value={mappingConfig.deliveryDate}
                onValueChange={(value) => handleMappingChange("deliveryDate", value)}
              >
                <SelectTrigger id="deliveryDate">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">明細情報のマッピング</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productCode">商品コード</Label>
              <Select
                value={mappingConfig.productCode}
                onValueChange={(value) => handleMappingChange("productCode", value)}
              >
                <SelectTrigger id="productCode">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">商品名</Label>
              <Select
                value={mappingConfig.productName}
                onValueChange={(value) => handleMappingChange("productName", value)}
              >
                <SelectTrigger id="productName">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Select value={mappingConfig.quantity} onValueChange={(value) => handleMappingChange("quantity", value)}>
                <SelectTrigger id="quantity">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">単位</Label>
              <Select value={mappingConfig.unit} onValueChange={(value) => handleMappingChange("unit", value)}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">単価</Label>
              <Select
                value={mappingConfig.unitPrice}
                onValueChange={(value) => handleMappingChange("unitPrice", value)}
              >
                <SelectTrigger id="unitPrice">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">金額</Label>
              <Select value={mappingConfig.amount} onValueChange={(value) => handleMappingChange("amount", value)}>
                <SelectTrigger id="amount">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleExecuteMapping}>マッピング実行</Button>
        </div>
      </div>
    )
  }

  // マッピング結果の表示
  const renderMappingResult = () => {
    if (mappingResult.length === 0) return null

    return (
      <div className="space-y-6">
        {showMappingSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>マッピング完了</AlertTitle>
            <AlertDescription>データのマッピングが完了しました。結果を確認してください。</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium">マッピング結果</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" /> マッピング成功:{" "}
                {mappingResult.filter((order) => order.status === "mapped").length}
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertCircle className="h-3 w-3 mr-1" /> 部分マッピング:{" "}
                {mappingResult.filter((order) => order.status === "partial").length}
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <X className="h-3 w-3 mr-1" /> マッピング失敗:{" "}
                {mappingResult.filter((order) => order.status === "unmapped").length}
              </Badge>
            </div>
          </div>

          {mappingResult.map((order) => (
            <Card
              key={order.id}
              className={
                order.status === "mapped"
                  ? "border-green-200"
                  : order.status === "partial"
                    ? "border-yellow-200"
                    : "border-red-200"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    発注番号: {order.orderNumber}
                    {order.status === "mapped" && (
                      <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3 mr-1" /> マッピング成功
                      </Badge>
                    )}
                    {order.status === "partial" && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <AlertCircle className="h-3 w-3 mr-1" /> 部分マッピング
                      </Badge>
                    )}
                    {order.status === "unmapped" && (
                      <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
                        <X className="h-3 w-3 mr-1" /> マッピング失敗
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">発注日</p>
                    <p className="font-medium">{order.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">仕入先</p>
                    <p className="font-medium">
                      {order.vendorName} ({order.vendorCode})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">部署/担当者</p>
                    <p className="font-medium">
                      {order.department} / {order.personInCharge}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">納期</p>
                    <p className="font-medium">{order.deliveryDate}</p>
                  </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-sky-50 to-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">商品コード</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">商品名</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">数量</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">単位</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">単価</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">金額</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">状態</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.productCode}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.productName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.unit}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {item.status === "mapped" ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <Check className="h-3 w-3 mr-1" /> 成功
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              <X className="h-3 w-3 mr-1" /> 失敗
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleCreateDraftOrders}>仮発注データ作成</Button>
        </div>

        {showCreationSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>仮発注データ作成完了</AlertTitle>
            <AlertDescription>
              {createdDraftOrders}件の仮発注データが作成されました。発注一覧画面から確認できます。
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // カメラの開始
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setCameraStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setIsCapturing(true)
    } catch (err) {
      console.error("カメラの起動に失敗しました:", err)
      setIsCameraAvailable(false)
    }
  }

  // カメラの停止
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
      setIsCapturing(false)
    }
  }

  // 写真撮影
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // キャンバスのサイズをビデオのサイズに合わせる
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // ビデオフレームをキャンバスに描画
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // キャンバスから画像データを取得
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // 撮影した画像をファイルとして扱う
              const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })

              // ファイル名を設定
              setFileName("camera-capture.jpg")
              setFileType("image")

              // 画像の内容を設定
              const reader = new FileReader()
              reader.onload = (e) => {
                if (e.target?.result) {
                  setFileContent({
                    preview: "カメラで撮影した画像",
                    extractedText: "画像解析中...",
                  })

                  // OCR処理をシミュレート
                  setTimeout(() => {
                    setFileContent({
                      preview: "カメラで撮影した画像（OCR処理後）",
                      extractedText:
                        "注文書\n" +
                        "注文番号: PO-2023-005\n" +
                        "注文日: 2023/04/05\n" +
                        "仕入先: 株式会社佐藤電機 (V005)\n" +
                        "部署: 製造部\n" +
                        "担当者: 佐藤五郎\n" +
                        "納期: 2023/05/10\n\n" +
                        "商品コード: P007\n" +
                        "商品名: 工業用モーター\n" +
                        "数量: 5\n" +
                        "単位: 個\n" +
                        "単価: 50000\n" +
                        "金額: 250000",
                    })
                  }, 1500)
                }
              }
              reader.readAsDataURL(blob)

              // カメラを停止
              stopCamera()

              // プレビュータブに移動
              setTimeout(() => {
                setActiveTab("preview")
              }, 500)
            }
          },
          "image/jpeg",
          0.95,
        )
      }
    }
  }

  // コンポーネントのアンマウント時にカメラを停止
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">発注データ取込</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">
            <FileUp className="h-4 w-4 mr-2" />
            ファイルアップロード
          </TabsTrigger>
          <TabsTrigger value="camera">
            <Camera className="h-4 w-4 mr-2" />
            カメラ撮影
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!fileContent}>
            <FileText className="h-4 w-4 mr-2" />
            ファイルプレビュー
          </TabsTrigger>
          <TabsTrigger value="mapping" disabled={!fileContent}>
            <Table className="h-4 w-4 mr-2" />
            マッピング設定
          </TabsTrigger>
          <TabsTrigger value="mapping-result" disabled={mappingResult.length === 0}>
            <Check className="h-4 w-4 mr-2" />
            マッピング結果
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ファイルアップロード</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".xlsx,.xls,.pdf,.jpg,.jpeg,.png"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <FileUp className="h-12 w-12 text-gray-400" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      ファイルをドラッグ＆ドロップするか、ファイルを選択してください
                    </p>
                    <p className="text-sm text-gray-500">
                      サポートされているファイル形式: EXCEL (.xlsx, .xls), PDF (.pdf), 画像 (.jpg, .jpeg, .png)
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Button onClick={handleSelectFileClick}>ファイルを選択</Button>
                    <Button variant="outline" onClick={() => setActiveTab("camera")}>
                      <Camera className="h-4 w-4 mr-2" />
                      カメラで撮影
                    </Button>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{fileName} をアップロード中...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>カメラ撮影</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCameraAvailable ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>カメラにアクセスできません</AlertTitle>
                  <AlertDescription>
                    お使いのデバイスのカメラにアクセスできないか、カメラへのアクセス許可がありません。
                    ブラウザの設定でカメラへのアクセスを許可してください。
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="relative border rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                    {isCapturing ? (
                      <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full" />
                    ) : (
                      <div className="text-center p-8">
                        <CameraOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">カメラが起動していません</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex justify-center space-x-4">
                    {!isCapturing ? (
                      <Button onClick={startCamera}>
                        <Camera className="h-4 w-4 mr-2" />
                        カメラを起動
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={stopCamera}>
                          <CameraOff className="h-4 w-4 mr-2" />
                          キャンセル
                        </Button>
                        <Button onClick={capturePhoto}>
                          <Camera className="h-4 w-4 mr-2" />
                          撮影する
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    <p>発注書や請求書を平らな場所に置き、四隅が見えるように撮影してください。</p>
                    <p>明るい場所で、影ができないようにすると認識精度が向上します。</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ファイルプレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              {renderFilePreview()}
              <div className="flex justify-end mt-4">
                <Button onClick={() => setActiveTab("mapping")}>次へ: マッピング設定</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>マッピング設定</CardTitle>
            </CardHeader>
            <CardContent>{renderMappingForm()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping-result" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>マッピング結果と仮発注データ作成</CardTitle>
            </CardHeader>
            <CardContent>{renderMappingResult()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
