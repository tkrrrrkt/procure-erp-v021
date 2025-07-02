"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, X, Shield, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createVendorSchema, CreateVendorFormData } from "@/lib/validation/schemas"
import { useValidatedForm, useFormErrorHandler } from "@/hooks/useValidatedForm"
import { ClientSanitizer } from "@/lib/validation/sanitizer"

// 企業級検証スキーマ使用（バックエンドDTO完全同期）
type FormValues = CreateVendorFormData

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

// 担当者リスト
const employees = [
  { id: "E001", name: "田中 健太" },
  { id: "E002", name: "佐藤 美咲" },
  { id: "E003", name: "鈴木 大輔" },
  { id: "E004", name: "高橋 直子" },
  { id: "E005", name: "伊藤 誠" },
]

export default function NewVendorPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useHyphen, setUseHyphen] = useState(true)
  const [sanitizationStats, setSanitizationStats] = useState(ClientSanitizer.getStats())
  const { handleValidationErrors, handleSanitizationComplete } = useFormErrorHandler()

  // 企業級検証・サニタイゼーション統合フォーム
  const form = useValidatedForm({
    schema: createVendorSchema,
    defaultValues: {
      name: "",
      code: "",
      kana_name: "",
      email: "",
      phone: "",
      fax: "",
      postal_code: "",
      address: "",
      website: "",
      business_categories: [],
      notes: "",
      is_active: true,
    },
    sanitizationOptions: {
      stripHtml: true,
      trim: true,
      maxLength: 1000,
      escapeSql: true,
    },
    onValidationError: handleValidationErrors,
    onSanitizationComplete: (data) => {
      handleSanitizationComplete(data)
      setSanitizationStats(ClientSanitizer.getStats())
    },
    enableRealTimeValidation: true,
    autoSanitize: true,
  })

  // フォーム送信処理
  const onSubmit = form.handleSafeSubmit(
    async (values: FormValues) => {
      setIsSubmitting(true)
      try {
        console.log('🔒 企業級検証済みベンダーデータ:', values)
        
        // 最終サニタイゼーション統計更新
        setSanitizationStats(ClientSanitizer.getStats())
        
        // バックエンドAPI呼び出し（既に検証・サニタイズ済み）
        // await createVendor(values)
        
        router.push('/vendors')
      } catch (error) {
        console.error('🚨 ベンダー作成エラー:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    (errors) => {
      console.warn('🔍 フォーム検証エラー:', errors)
      setIsSubmitting(false)
    }
  )

  // 郵便番号のフォーマット処理
  const formatPostalCode = (value: string) => {
    // 数字以外を削除
    const numbers = value.replace(/[^\d]/g, "")

    if (numbers.length <= 3) {
      return numbers
    }

    if (useHyphen) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`
    } else {
      return numbers.slice(0, 7)
    }
  }

  return (
    <div className="container-fluid px-4 mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">仕入先マスタ登録</h1>
        <div className="text-right text-sm text-muted-foreground">モード：新規</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">仕入先コード</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">仕入先名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">仕入先名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kana_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">仕入先カナ名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel className="bg-blue-100 px-4 py-2 block flex-1">郵便番号</FormLabel>
                            <div className="flex items-center gap-2 text-sm">
                              <span>ハイフン</span>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded ${useHyphen ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                                onClick={() => setUseHyphen(true)}
                              >
                                あり
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded ${!useHyphen ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                                onClick={() => setUseHyphen(false)}
                              >
                                なし
                              </button>
                            </div>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPostalCode(e.target.value)
                                field.onChange(formatted)
                              }}
                              maxLength={useHyphen ? 8 : 7}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prefecture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">都道府県</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="選択してください" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {prefectures.map((prefecture) => (
                                <SelectItem key={prefecture} value={prefecture}>
                                  {prefecture}
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
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">市区町村</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">場所名</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="building"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">ビル名</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">電話番号</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="bg-blue-100 px-4 py-2 block">FAX番号</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-blue-100 px-4 py-2 block">MAIL</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">仕入先担当者</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">仕入先担当者TEL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <FormField
                  control={form.control}
                  name="roundingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">金額丸めフラグ</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="truncate" id="truncate" />
                            <label htmlFor="truncate">切り捨て</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="round" id="round" />
                            <label htmlFor="round">四捨五入</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ceiling" id="ceiling" />
                            <label htmlFor="ceiling">切り上げ</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="bg-blue-100 px-4 py-2 block">連携社員コード</FormLabel>
                      <FormControl>
                        <Combobox
                          options={employees.map((emp) => ({ value: emp.id, label: `${emp.id} - ${emp.name}` }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="社員を選択または入力"
                          emptyMessage="該当する社員がありません"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormLabel className="bg-blue-100 px-4 py-2 block flex-1">有効/無効フラグ</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            id="isInactive"
                          />
                          <label
                            htmlFor="isInactive"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            無効
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <div className="flex space-x-2">
                <Button variant="outline" type="button" onClick={() => router.push("/vendors")}>
                  <X className="mr-2 h-4 w-4" />
                  閉じる
                </Button>
                <Button variant="outline" type="button" onClick={() => router.push("/vendors")}>
                  仕入先マスタ一覧
                </Button>
              </div>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                登録
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
