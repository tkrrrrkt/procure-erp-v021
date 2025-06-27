"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

// 倉庫区分の定義
const WAREHOUSE_TYPES = [
  { value: "1", label: "通常倉庫" },
  { value: "2", label: "外部倉庫" },
  { value: "3", label: "仮想倉庫" },
  { value: "4", label: "返品倉庫" },
  { value: "5", label: "不良品倉庫" },
]

export default function NewWarehousePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    shortName: "",
    kanaName: "",
    address: "",
    phone: "",
    fax: "",
    type: "1",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = "倉庫コードは必須です"
    } else if (!/^[A-Za-z0-9]+$/.test(formData.code)) {
      newErrors.code = "倉庫コードは英数字のみ使用できます"
    }

    if (!formData.name.trim()) {
      newErrors.name = "倉庫名は必須です"
    }

    if (!formData.shortName.trim()) {
      newErrors.shortName = "倉庫略名は必須です"
    }

    if (!formData.kanaName.trim()) {
      newErrors.kanaName = "倉庫カナ名は必須です"
    } else if (!/^[ァ-ヶー]+$/.test(formData.kanaName)) {
      newErrors.kanaName = "倉庫カナ名はカタカナのみ使用できます"
    }

    if (formData.phone && !/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = "電話番号は数字とハイフンのみ使用できます"
    }

    if (formData.fax && !/^[0-9-]+$/.test(formData.fax)) {
      newErrors.fax = "FAX番号は数字とハイフンのみ使用できます"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // ここでAPIを呼び出して保存処理を行う
      console.log("保存するデータ:", formData)

      // 保存成功後、一覧画面に戻る
      alert("倉庫情報を保存しました")
      router.push("/warehouses")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/warehouses">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">倉庫登録</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>倉庫情報</CardTitle>
            <CardDescription>新しい倉庫の情報を入力してください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">
                  倉庫コード <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="例: W001"
                  value={formData.code}
                  onChange={handleChange}
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  倉庫区分 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="倉庫区分を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {WAREHOUSE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  倉庫名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="例: 本社倉庫"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortName">
                  倉庫略名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shortName"
                  name="shortName"
                  placeholder="例: 本社"
                  value={formData.shortName}
                  onChange={handleChange}
                  className={errors.shortName ? "border-red-500" : ""}
                />
                {errors.shortName && <p className="text-red-500 text-sm">{errors.shortName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kanaName">
                  倉庫カナ名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kanaName"
                  name="kanaName"
                  placeholder="例: ホンシャソウコ"
                  value={formData.kanaName}
                  onChange={handleChange}
                  className={errors.kanaName ? "border-red-500" : ""}
                />
                {errors.kanaName && <p className="text-red-500 text-sm">{errors.kanaName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="例: 03-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fax">FAX番号</Label>
                <Input
                  id="fax"
                  name="fax"
                  placeholder="例: 03-1234-5679"
                  value={formData.fax}
                  onChange={handleChange}
                  className={errors.fax ? "border-red-500" : ""}
                />
                {errors.fax && <p className="text-red-500 text-sm">{errors.fax}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="例: 東京都千代田区丸の内1-1-1"
                value={formData.address}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/warehouses">
              <Button variant="outline">キャンセル</Button>
            </Link>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
