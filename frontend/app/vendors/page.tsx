"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  ArrowUpDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// 仕入先データの型定義
interface Vendor {
  id: string
  code: string
  name: string
  shortName: string
  kanaName: string
  postalCode: string
  prefecture: string
  city: string
  address: string
  building: string
  phone: string
  fax: string
  email: string
  contactPerson: string
  contactPhone: string
  notes: string
  roundingMethod: "truncate" | "round" | "ceiling"
  employeeCode: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// サンプルデータ
const sampleVendors: Vendor[] = [
  {
    id: "1",
    code: "V001",
    name: "株式会社山田製作所",
    shortName: "山田製作所",
    kanaName: "ヤマダセイサクショ",
    postalCode: "1010001",
    prefecture: "東京都",
    city: "千代田区",
    address: "神田1-1-1",
    building: "神田ビル5F",
    phone: "03-1234-5678",
    fax: "03-1234-5679",
    email: "info@yamada-seisakusho.co.jp",
    contactPerson: "山田太郎",
    contactPhone: "03-1234-5680",
    notes: "金属部品の主要仕入先",
    roundingMethod: "truncate",
    employeeCode: "E001",
    isActive: true,
    createdAt: new Date(2023, 0, 15),
    updatedAt: new Date(2023, 5, 20),
  },
  {
    id: "2",
    code: "V002",
    name: "東京電子工業株式会社",
    shortName: "東京電子",
    kanaName: "トウキョウデンシ",
    postalCode: "1600023",
    prefecture: "東京都",
    city: "新宿区",
    address: "西新宿2-2-2",
    building: "新宿ビル10F",
    phone: "03-2345-6789",
    fax: "03-2345-6780",
    email: "contact@tokyo-denshi.co.jp",
    contactPerson: "佐藤次郎",
    contactPhone: "03-2345-6781",
    notes: "電子部品専門",
    roundingMethod: "round",
    employeeCode: "E002",
    isActive: true,
    createdAt: new Date(2023, 1, 10),
    updatedAt: new Date(2023, 6, 15),
  },
  {
    id: "3",
    code: "V003",
    name: "大阪金属工業株式会社",
    shortName: "大阪金属",
    kanaName: "オオサカキンゾク",
    postalCode: "5300001",
    prefecture: "大阪府",
    city: "大阪市北区",
    address: "梅田3-3-3",
    building: "梅田センタービル8F",
    phone: "06-3456-7890",
    fax: "06-3456-7891",
    email: "info@osaka-kinzoku.co.jp",
    contactPerson: "田中三郎",
    contactPhone: "06-3456-7892",
    notes: "金属加工品の仕入先",
    roundingMethod: "ceiling",
    employeeCode: "E003",
    isActive: true,
    createdAt: new Date(2023, 2, 5),
    updatedAt: new Date(2023, 7, 10),
  },
  {
    id: "4",
    code: "V004",
    name: "名古屋機械工業株式会社",
    shortName: "名古屋機械",
    kanaName: "ナゴヤキカイ",
    postalCode: "4600008",
    prefecture: "愛知県",
    city: "名古屋市中区",
    address: "栄4-4-4",
    building: "栄ビル3F",
    phone: "052-4567-8901",
    fax: "052-4567-8902",
    email: "contact@nagoya-kikai.co.jp",
    contactPerson: "鈴木四郎",
    contactPhone: "052-4567-8903",
    notes: "機械部品専門",
    roundingMethod: "truncate",
    employeeCode: "E004",
    isActive: true,
    createdAt: new Date(2023, 3, 20),
    updatedAt: new Date(2023, 8, 25),
  },
  {
    id: "5",
    code: "V005",
    name: "福岡精密機器株式会社",
    shortName: "福岡精密",
    kanaName: "フクオカセイミツ",
    postalCode: "8100001",
    prefecture: "福岡県",
    city: "福岡市中央区",
    address: "天神5-5-5",
    building: "天神ビル7F",
    phone: "092-5678-9012",
    fax: "092-5678-9013",
    email: "info@fukuoka-seimitsu.co.jp",
    contactPerson: "高橋五郎",
    contactPhone: "092-5678-9014",
    notes: "精密機器の仕入先",
    roundingMethod: "round",
    employeeCode: "E005",
    isActive: true,
    createdAt: new Date(2023, 4, 15),
    updatedAt: new Date(2023, 9, 20),
  },
  {
    id: "6",
    code: "V006",
    name: "札幌工業株式会社",
    shortName: "札幌工業",
    kanaName: "サッポロコウギョウ",
    postalCode: "0600001",
    prefecture: "北海道",
    city: "札幌市中央区",
    address: "大通西6-6-6",
    building: "札幌ビル4F",
    phone: "011-6789-0123",
    fax: "011-6789-0124",
    email: "contact@sapporo-kogyo.co.jp",
    contactPerson: "伊藤六郎",
    contactPhone: "011-6789-0125",
    notes: "北海道地域の主要仕入先",
    roundingMethod: "ceiling",
    employeeCode: "E006",
    isActive: false,
    createdAt: new Date(2023, 5, 10),
    updatedAt: new Date(2023, 10, 15),
  },
  {
    id: "7",
    code: "V007",
    name: "仙台金属加工株式会社",
    shortName: "仙台金属",
    kanaName: "センダイキンゾク",
    postalCode: "9800001",
    prefecture: "宮城県",
    city: "仙台市青葉区",
    address: "中央7-7-7",
    building: "仙台センタービル9F",
    phone: "022-7890-1234",
    fax: "022-7890-1235",
    email: "info@sendai-kinzoku.co.jp",
    contactPerson: "渡辺七郎",
    contactPhone: "022-7890-1236",
    notes: "東北地域の金属加工品仕入先",
    roundingMethod: "truncate",
    employeeCode: "E007",
    isActive: true,
    createdAt: new Date(2023, 6, 5),
    updatedAt: new Date(2023, 11, 10),
  },
  {
    id: "8",
    code: "V008",
    name: "広島製作所",
    shortName: "広島製作所",
    kanaName: "ヒロシマセイサクショ",
    postalCode: "7300001",
    prefecture: "広島県",
    city: "広島市中区",
    address: "白島8-8-8",
    building: "広島ビル2F",
    phone: "082-8901-2345",
    fax: "082-8901-2346",
    email: "contact@hiroshima-seisakusho.co.jp",
    contactPerson: "松本八郎",
    contactPhone: "082-8901-2347",
    notes: "中国地方の主要仕入先",
    roundingMethod: "round",
    employeeCode: "E008",
    isActive: true,
    createdAt: new Date(2023, 7, 20),
    updatedAt: new Date(2023, 0, 25),
  },
]

// 都道府県リスト
const prefectures = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
]

export default function VendorsPage() {
  // 検索とフィルタリングのための状態
  const [searchTerm, setSearchTerm] = useState("")
  const [prefectureFilter, setPrefectureFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "code",
    direction: "asc",
  })

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // フィルタリングとソート
  const filteredVendors = sampleVendors
    .filter((vendor) => {
      // 検索語句でフィルタリング
      const searchMatch =
        searchTerm === "" ||
        vendor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.kanaName.toLowerCase().includes(searchTerm.toLowerCase())

      // 都道府県でフィルタリング
      const prefectureMatch = prefectureFilter === "all" || vendor.prefecture === prefectureFilter

      // 有効/無効でフィルタリング
      const activeMatch =
        activeFilter === "all" ||
        (activeFilter === "active" && vendor.isActive) ||
        (activeFilter === "inactive" && !vendor.isActive)

      return searchMatch && prefectureMatch && activeMatch
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig

      if (key === "code") {
        return direction === "asc" ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code)
      }

      if (key === "name") {
        return direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }

      if (key === "prefecture") {
        return direction === "asc" ? a.prefecture.localeCompare(b.prefecture) : b.prefecture.localeCompare(a.prefecture)
      }

      if (key === "createdAt") {
        return direction === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime()
      }

      return 0
    })

  // ページネーション処理
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage)
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // ソート処理
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  // フィルターをリセット
  const resetFilters = () => {
    setSearchTerm("")
    setPrefectureFilter("all")
    setActiveFilter("all")
    setCurrentPage(1)
  }

  return (
    <div className="container-fluid px-4 mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">仕入先マスタ</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="mr-2 h-4 w-4" />
            フィルター
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button asChild>
            <Link href="/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              新規登録
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="仕入先コード、仕入先名、カナ名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="active">有効</SelectItem>
                  <SelectItem value="inactive">無効</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFilterOpen && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select value={prefectureFilter} onValueChange={setPrefectureFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての都道府県</SelectItem>
                    {prefectures.map((prefecture) => (
                      <SelectItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end md:col-span-2">
                  <Button variant="outline" onClick={resetFilters}>
                    フィルターをリセット
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
              <TableRow>
                <TableHead className="w-[100px]">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("code")}>
                    仕入先コード
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
                    仕入先名
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>カナ名</TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("prefecture")}>
                    都道府県
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("createdAt")}>
                    登録日
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    該当する仕入先データがありません
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.code}</TableCell>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.kanaName}</TableCell>
                    <TableCell>{vendor.prefecture}</TableCell>
                    <TableCell>{vendor.phone}</TableCell>
                    <TableCell>{vendor.contactPerson}</TableCell>
                    <TableCell>{format(vendor.createdAt, "yyyy/MM/dd", { locale: ja })}</TableCell>
                    <TableCell>
                      <Badge className={vendor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {vendor.isActive ? "有効" : "無効"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <SlidersHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/vendors/${vendor.id}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              詳細を表示
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vendors/${vendor.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ページネーション */}
      {filteredVendors.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {filteredVendors.length} 件中 {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredVendors.length)} 件を表示
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <div className="flex items-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
