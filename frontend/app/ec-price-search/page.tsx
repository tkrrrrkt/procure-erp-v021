"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ShoppingCart,
  ExternalLink,
  TrendingDown,
  Clock,
  Truck,
  AlertCircle,
  Check,
  Info,
  RefreshCw,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchProductPrices } from "./actions"
import { ecSites, categories, type ProductListing } from "@/lib/ec-sites-data"

export default function ECPriceSearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [partNumber, setPartNumber] = useState("")
  const [specifications, setSpecifications] = useState("")
  const [category, setCategory] = useState("")
  const [searchResults, setSearchResults] = useState<ProductListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSites, setSelectedSites] = useState<number[]>(ecSites.map((site) => site.id))
  const [activeTab, setActiveTab] = useState("search")
  const [selectedResult, setSelectedResult] = useState<ProductListing | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [sortField, setSortField] = useState<"price" | "delivery">("price")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // 検索を実行
  const handleSearch = async () => {
    if (!searchQuery && !partNumber) {
      setErrorMessage("商品名または型式を入力してください")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetchProductPrices(searchQuery, partNumber, category, selectedSites)

      if (response.success) {
        setSearchResults(response.data)

        // 結果があればタブを結果表示に切り替え
        if (response.data.length > 0) {
          setActiveTab("results")
          setLastUpdated(new Date().toLocaleString())
        } else {
          setErrorMessage("検索条件に一致する商品が見つかりませんでした")
        }
      } else {
        setErrorMessage(response.message)
      }
    } catch (error) {
      console.error("検索エラー:", error)
      setErrorMessage("検索処理中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // ECサイトの選択状態を切り替え
  const toggleSiteSelection = (siteId: number) => {
    setSelectedSites((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
  }

  // 詳細表示
  const showDetails = (result: ProductListing) => {
    setSelectedResult(result)
    setActiveTab("details")
  }

  // 最安値を計算
  const getLowestPrice = () => {
    if (searchResults.length === 0) return null
    return searchResults.reduce(
      (min, result) => (result.unitPrice < min ? result.unitPrice : min),
      searchResults[0].unitPrice,
    )
  }

  // 結果のソート
  const sortResults = (field: "price" | "delivery") => {
    if (field === sortField) {
      // 同じフィールドの場合は順序を反転
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      // 異なるフィールドの場合はそのフィールドの昇順に設定
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // ソート適用
  useEffect(() => {
    if (searchResults.length === 0) return

    const sortedResults = [...searchResults]

    if (sortField === "price") {
      sortedResults.sort((a, b) => (sortOrder === "asc" ? a.unitPrice - b.unitPrice : b.unitPrice - a.unitPrice))
    } else if (sortField === "delivery") {
      sortedResults.sort((a, b) =>
        sortOrder === "asc" ? a.deliveryDays - b.deliveryDays : b.deliveryDays - a.deliveryDays,
      )
    }

    setSearchResults(sortedResults)
  }, [sortField, sortOrder])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">ECサイト価格検索</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">検索条件</TabsTrigger>
          <TabsTrigger value="results" disabled={searchResults.length === 0}>
            検索結果 {searchResults.length > 0 && `(${searchResults.length})`}
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedResult}>
            詳細情報
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>部品検索</CardTitle>
              <CardDescription>商品名、型式、仕様を入力して、複数のECサイトから価格情報を取得します。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-query">商品名/キーワード</Label>
                  <Input
                    id="search-query"
                    placeholder="例: 抵抗器、ベアリング、モーター"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="part-number">型式/部品番号</Label>
                  <Input
                    id="part-number"
                    placeholder="例: A2212-10T、6082-T6"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">仕様/詳細</Label>
                <Textarea
                  id="specifications"
                  placeholder="例: 10kΩ 1/4W 5%、内径8mm 外径22mm、12V 1.5A"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのカテゴリ</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label>検索対象ECサイト</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ecSites.map((site) => (
                    <div key={site.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`site-${site.id}`}
                        checked={selectedSites.includes(site.id)}
                        onCheckedChange={() => toggleSiteSelection(site.id)}
                      />
                      <Label htmlFor={`site-${site.id}`} className="cursor-pointer">
                        {site.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSearch} className="w-full mt-4" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    検索中...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    価格検索
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ECサイトからデータを取得中...</span>
                    <span className="text-sm">処理中</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>検索結果: {searchQuery || partNumber}</CardTitle>
                <Badge variant="outline" className="ml-2">
                  {searchResults.length}件
                </Badge>
              </div>
              <CardDescription>
                {searchResults.length > 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 mr-1 text-green-500" />
                      <span>最安値: {getLowestPrice()?.toLocaleString()}円</span>
                    </div>
                    {lastUpdated && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>最終更新: {lastUpdated}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  "該当する結果がありません"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4 gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => sortResults("price")}>
                        価格
                        {sortField === "price" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>価格で並べ替え</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => sortResults("delivery")}>
                        納期
                        {sortField === "delivery" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="ml-1 h-3 w-3" />
                          ) : (
                            <SortDesc className="ml-1 h-3 w-3" />
                          ))}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>納期で並べ替え</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ECサイト</TableHead>
                    <TableHead>型番</TableHead>
                    <TableHead className="text-right">単価</TableHead>
                    <TableHead>在庫</TableHead>
                    <TableHead>納期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>{result.siteName}</TableCell>
                      <TableCell>
                        <div className="font-medium">{result.manufacturerPartNumber}</div>
                        <div className="text-xs text-muted-foreground">{result.partNumber}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {result.unitPrice.toLocaleString()}円
                        {result.unitPrice === getLowestPrice() && (
                          <Badge variant="secondary" className="ml-2">
                            最安値
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.stockStatus === "在庫切れ" ? (
                          <span className="text-red-500 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            在庫切れ
                          </span>
                        ) : (
                          <span className="text-green-500 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            {result.stockQuantity}個
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Truck className="h-3 w-3 mr-1" />
                          {result.deliveryDays}日
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => showDetails(result)}>
                            詳細
                          </Button>
                          <Button variant="default" size="sm" onClick={() => window.open(result.siteUrl, "_blank")}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            サイト
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="flex items-center text-sm text-muted-foreground">
                <Info className="h-4 w-4 mr-2" />
                表示されている価格や在庫情報は実際のECサイトの情報と異なる場合があります。
              </div>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>価格比較</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center">
                      <div className="w-24 truncate">{result.siteName}</div>
                      <div className="flex-1 mx-2">
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(100, ((getLowestPrice() || 1) / result.unitPrice) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right font-medium">{result.unitPrice.toLocaleString()}円</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ボリュームディスカウント比較</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>数量</TableHead>
                      {searchResults.slice(0, 3).map((result) => (
                        <TableHead key={result.id} className="text-right">
                          {result.siteName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[10, 50, 100, 500].map((quantity) => (
                      <TableRow key={quantity}>
                        <TableCell>{quantity}個</TableCell>
                        {searchResults.slice(0, 3).map((result) => {
                          const discount = result.volumeDiscounts.find((d) => d.quantity <= quantity)
                          return (
                            <TableCell key={result.id} className="text-right">
                              {discount ? discount.price.toLocaleString() : result.unitPrice.toLocaleString()}円
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedResult && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{selectedResult.manufacturerPartNumber}</CardTitle>
                    <Badge>{selectedResult.siteName}</Badge>
                  </div>
                  <CardDescription>{selectedResult.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">基本情報</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">メーカー:</span>
                          <span className="font-medium">{selectedResult.manufacturer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">型番:</span>
                          <span>{selectedResult.manufacturerPartNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ECサイト型番:</span>
                          <span>{selectedResult.partNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">単価:</span>
                          <span className="font-medium">{selectedResult.unitPrice.toLocaleString()}円</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">最小注文数量:</span>
                          <span>{selectedResult.minOrderQuantity}個</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">在庫状況:</span>
                          <span
                            className={selectedResult.stockStatus === "在庫切れ" ? "text-red-500" : "text-green-500"}
                          >
                            {selectedResult.stockQuantity}個
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">納期:</span>
                          <span>{selectedResult.deliveryDays}日</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">最終更新:</span>
                          <span>{new Date(selectedResult.lastUpdated).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">仕様</h3>
                      <div className="space-y-2">
                        {Object.entries(selectedResult.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">ボリュームディスカウント</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>数量</TableHead>
                          <TableHead className="text-right">単価</TableHead>
                          <TableHead className="text-right">割引率</TableHead>
                          <TableHead className="text-right">合計</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>1個〜</TableCell>
                          <TableCell className="text-right">{selectedResult.unitPrice.toLocaleString()}円</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">{selectedResult.unitPrice.toLocaleString()}円〜</TableCell>
                        </TableRow>
                        {selectedResult.volumeDiscounts.map((discount, index) => (
                          <TableRow key={index}>
                            <TableCell>{discount.quantity}個以上</TableCell>
                            <TableCell className="text-right">{discount.price.toLocaleString()}円</TableCell>
                            <TableCell className="text-right">
                              {Math.round((1 - discount.price / selectedResult.unitPrice) * 100)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {(discount.price * discount.quantity).toLocaleString()}円〜
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("results")}>
                      検索結果に戻る
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => window.open(selectedResult.siteUrl, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        ECサイトで見る
                      </Button>
                      <Button>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        発注依頼に追加
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>注意</AlertTitle>
                <AlertDescription>
                  表示されている価格や在庫情報は実際のECサイトの情報と異なる場合があります。最新の情報は各ECサイトでご確認ください。
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
