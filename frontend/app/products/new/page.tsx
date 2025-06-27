"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function NewProductPage() {
  const [productType, setProductType] = useState("通常商品")
  const [valuationMethod, setValuationMethod] = useState("月次総平均法")
  const [salesEnabled, setSalesEnabled] = useState("する")
  const [orderEnabled, setOrderEnabled] = useState("する")
  const [salesTaxMethod, setSalesTaxMethod] = useState("税抜き")
  const [purchaseTaxMethod, setPurchaseTaxMethod] = useState("税抜き")
  const [minCheckMethod, setMinCheckMethod] = useState("しない")
  const [salesStartDate, setSalesStartDate] = useState<Date | undefined>(undefined)
  const [salesEndDate, setSalesEndDate] = useState<Date | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // フォーム送信処理
    console.log("商品登録フォームが送信されました")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">商品マスタ登録</h1>
        <div className="text-sm text-gray-500">モード：新規</div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basic">基本</TabsTrigger>
            <TabsTrigger value="inventory">在庫/数量/EC</TabsTrigger>
            <TabsTrigger value="tax">税区分</TabsTrigger>
            <TabsTrigger value="staff">自社担当情報</TabsTrigger>
            <TabsTrigger value="custom">汎用項目</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
                <CardDescription>商品の基本情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="productCode" className="bg-blue-100 px-4 py-2 block">
                      商品コード
                    </Label>
                    <Input id="productCode" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productType" className="bg-blue-100 px-4 py-2 block">
                      商品種別
                    </Label>
                    <RadioGroup value={productType} onValueChange={setProductType} className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="通常商品" id="type-normal" />
                        <Label htmlFor="type-normal">通常商品</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="廃止" id="type-discontinued" />
                        <Label htmlFor="type-discontinued">廃止</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="制御用" id="type-control" />
                        <Label htmlFor="type-control">制御用</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="製造原価項目" id="type-cost" />
                        <Label htmlFor="type-cost">製造原価項目</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ファントム" id="type-phantom" />
                        <Label htmlFor="type-phantom">ファントム</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="bg-blue-100 px-4 py-2 block">
                      商品名
                    </Label>
                    <Input id="productName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productShortName" className="bg-blue-100 px-4 py-2 block">
                      商品略名
                    </Label>
                    <Input id="productShortName" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="productKanaName" className="bg-blue-100 px-4 py-2 block">
                      商品カナ名
                    </Label>
                    <Input id="productKanaName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitGroup" className="bg-blue-100 px-4 py-2 block">
                      単位グループ
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input id="unitGroup" />
                      <div className="flex items-center space-x-2">
                        <Checkbox id="noUnitGroup" />
                        <Label htmlFor="noUnitGroup">無効</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="productEnglishName" className="bg-blue-100 px-4 py-2 block">
                      商品英文字名
                    </Label>
                    <Input id="productEnglishName" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>メーカー・コード情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="bg-blue-100 px-4 py-2 block">
                      メーカー
                    </Label>
                    <Input id="manufacturer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturerProductNumber" className="bg-blue-100 px-4 py-2 block">
                      メーカー商品番号
                    </Label>
                    <Input id="manufacturerProductNumber" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="bg-blue-100 px-4 py-2 block">
                      ブランド
                    </Label>
                    <Input id="brand" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsCode" className="bg-blue-100 px-4 py-2 block">
                      HSコード
                    </Label>
                    <Input id="hsCode" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="janCode" className="bg-blue-100 px-4 py-2 block">
                      JAN(EAN)コード
                    </Label>
                    <Input id="janCode" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upcCode" className="bg-blue-100 px-4 py-2 block">
                      UPCコード
                    </Label>
                    <Input id="upcCode" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>在庫・価格情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="valuationMethod" className="bg-blue-100 px-4 py-2 block">
                      在庫評価法
                    </Label>
                    <RadioGroup value={valuationMethod} onValueChange={setValuationMethod} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="標準原価法" id="method-standard" />
                        <Label htmlFor="method-standard">標準原価法</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="先入先出法" id="method-fifo" />
                        <Label htmlFor="method-fifo">先入先出法</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="移動平均法" id="method-moving" />
                        <Label htmlFor="method-moving">移動平均法</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="月次総平均法" id="method-monthly" />
                        <Label htmlFor="method-monthly">月次総平均法</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="受終仕入原価法" id="method-last" />
                        <Label htmlFor="method-last">受終仕入原価法</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="先価逆順原価法" id="method-reverse" />
                        <Label htmlFor="method-reverse">先価逆順原価法</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="cost" className="bg-blue-100 px-4 py-2 block">
                        原価
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="w-16 text-right">JPY</div>
                        <Input id="cost" type="number" className="flex-1" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="costGroup" className="bg-blue-100 px-4 py-2 block">
                        原価グループ
                      </Label>
                      <Input id="costGroup" />
                    </div>

                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox id="showCost" />
                      <Label htmlFor="showCost">未示用原価を設定</Label>
                      <div className="w-16 text-right ml-4">JPY</div>
                      <Input type="number" className="flex-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>販売情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salesEnabled" className="bg-blue-100 px-4 py-2 block">
                      販売
                    </Label>
                    <RadioGroup value={salesEnabled} onValueChange={setSalesEnabled} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="する" id="sales-enabled" />
                        <Label htmlFor="sales-enabled">する</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="しない" id="sales-disabled" />
                        <Label htmlFor="sales-disabled">しない</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="standardPrice" className="bg-blue-100 px-4 py-2 block">
                      標準単価
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="JPY">
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="通貨" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input id="standardPrice" type="number" className="flex-1" />
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox id="openPrice" />
                      <Label htmlFor="openPrice">オープンプライス</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salesPrice" className="bg-blue-100 px-4 py-2 block">
                      販売単価
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="JPY">
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="通貨" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input id="salesPrice" type="number" className="flex-1" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salesTaxMethod" className="bg-blue-100 px-4 py-2 block">
                      販売時消費税
                    </Label>
                    <RadioGroup value={salesTaxMethod} onValueChange={setSalesTaxMethod} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="税抜き" id="sales-tax-excluded" />
                        <Label htmlFor="sales-tax-excluded">税抜き</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="税込み" id="sales-tax-included" />
                        <Label htmlFor="sales-tax-included">税込み</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="bg-blue-100 px-4 py-2 block">
                      消費税率
                    </Label>
                    <Input id="taxRate" type="number" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salesPeriod" className="bg-blue-100 px-4 py-2 block">
                      販売期間
                    </Label>
                    <div className="flex items-center gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !salesStartDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {salesStartDate ? (
                              format(salesStartDate, "yyyy年MM月dd日", { locale: ja })
                            ) : (
                              <span>開始日を選択</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50">
                          <Calendar
                            mode="single"
                            selected={salesStartDate}
                            onSelect={setSalesStartDate}
                            initialFocus
                            locale={ja}
                          />
                        </PopoverContent>
                      </Popover>

                      <span>〜</span>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !salesEndDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {salesEndDate ? (
                              format(salesEndDate, "yyyy年MM月dd日", { locale: ja })
                            ) : (
                              <span>終了日を選択</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-50">
                          <Calendar
                            mode="single"
                            selected={salesEndDate}
                            onSelect={setSalesEndDate}
                            initialFocus
                            locale={ja}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>発注情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderEnabled" className="bg-blue-100 px-4 py-2 block">
                      発注
                    </Label>
                    <RadioGroup value={orderEnabled} onValueChange={setOrderEnabled} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="する" id="order-enabled" />
                        <Label htmlFor="order-enabled">する</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="しない" id="order-disabled" />
                        <Label htmlFor="order-disabled">しない</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier" className="bg-blue-100 px-4 py-2 block">
                      仕入先
                    </Label>
                    <Input id="supplier" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice" className="bg-blue-100 px-4 py-2 block">
                      仕入単価
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="JPY">
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="通貨" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input id="purchasePrice" type="number" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseTaxMethod" className="bg-blue-100 px-4 py-2 block">
                      仕入時消費税
                    </Label>
                    <RadioGroup value={purchaseTaxMethod} onValueChange={setPurchaseTaxMethod} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="税抜き" id="purchase-tax-excluded" />
                        <Label htmlFor="purchase-tax-excluded">税抜き</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="税込み" id="purchase-tax-included" />
                        <Label htmlFor="purchase-tax-included">税込み</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity" className="bg-blue-100 px-4 py-2 block">
                      最小発注数量
                    </Label>
                    <Input id="minOrderQuantity" type="number" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minOrderUnit" className="bg-blue-100 px-4 py-2 block">
                      最小発注単位
                    </Label>
                    <Input id="minOrderUnit" type="number" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minCheckMethod" className="bg-blue-100 px-4 py-2 block">
                      最小項目チェック
                    </Label>
                    <RadioGroup value={minCheckMethod} onValueChange={setMinCheckMethod} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="しない" id="min-check-none" />
                        <Label htmlFor="min-check-none">しない</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="警告" id="min-check-warning" />
                        <Label htmlFor="min-check-warning">警告</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="禁止" id="min-check-forbidden" />
                        <Label htmlFor="min-check-forbidden">禁止</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>税区分情報</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">このタブでは税区分に関する設定を行います。</p>
                <div className="space-y-4">
                  {/* 税区分の設定フィールドをここに追加 */}
                  <p className="text-sm text-gray-500">このセクションは開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>自社担当情報</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">このタブでは自社担当者に関する設定を行います。</p>
                <div className="space-y-4">
                  {/* 自社担当情報の設定フィールドをここに追加 */}
                  <p className="text-sm text-gray-500">このセクションは開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>汎用項目</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">このタブでは汎用項目の設定を行います。</p>
                <div className="space-y-4">
                  {/* 汎用項目の設定フィールドをここに追加 */}
                  <p className="text-sm text-gray-500">このセクションは開発中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button">
            閉じる
          </Button>
          <Button type="submit">登録</Button>
        </div>
      </form>
    </div>
  )
}
