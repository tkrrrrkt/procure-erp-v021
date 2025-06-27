"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 組織データの型定義
interface Organization {
  id: string
  code: string
  name: string
  shortName: string
  kanaName: string
  zipCode: string
  prefecture: string
  city: string
  location: string
  building: string
  phone: string
  fax: string
  isActive: boolean
  parentId: string | null
  departmentSymbol: string
}

// サンプルの親部門データ
const parentOrganizations = [
  { id: "1", name: "全社" },
  { id: "2", name: "一管理部" },
  { id: "3", name: "一営業部" },
  { id: "4", name: "一製作部" },
  { id: "5", name: "一一企画・デザイン課" },
  { id: "7", name: "一一製作1課" },
  { id: "9", name: "一一製作2課" },
]

export default function OrganizationNewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Organization>>({
    code: "",
    name: "",
    shortName: "",
    kanaName: "",
    zipCode: "",
    prefecture: "",
    city: "",
    location: "",
    building: "",
    phone: "",
    fax: "",
    isActive: true,
    parentId: null,
    departmentSymbol: "",
  })

  const handleChange = (field: keyof Organization, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("送信データ:", formData)
    // 実際のAPIリクエストはここに実装
    // 成功したら一覧画面に戻る
    router.push("/organizations")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">組織（ライン）マスタ登録</h1>
        <div className="text-sm text-muted-foreground">モード：新規</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：登録フォーム */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="code" className="bg-blue-100 px-4 py-2 block">
                    部門コード
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="name" className="bg-blue-100 px-4 py-2 block">
                    部門名
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shortName" className="bg-blue-100 px-4 py-2 block">
                    部門略名
                  </Label>
                  <Input
                    id="shortName"
                    value={formData.shortName}
                    onChange={(e) => handleChange("shortName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="kanaName" className="bg-blue-100 px-4 py-2 block">
                    部門カナ名
                  </Label>
                  <Input
                    id="kanaName"
                    value={formData.kanaName}
                    onChange={(e) => handleChange("kanaName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parentId" className="bg-blue-100 px-4 py-2 block">
                    上位部門
                  </Label>
                  <Select value={formData.parentId || ""} onValueChange={(value) => handleChange("parentId", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="上位部門を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">選択なし</SelectItem>
                      {parentOrganizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="departmentSymbol" className="bg-blue-100 px-4 py-2 block">
                    部門記号
                  </Label>
                  <Input
                    id="departmentSymbol"
                    value={formData.departmentSymbol}
                    onChange={(e) => handleChange("departmentSymbol", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 右側：住所情報 */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100">
              <CardTitle>住所・連絡先情報</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="zipCode" className="bg-blue-100 px-4 py-2 block">
                    郵便番号
                  </Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                    className="mt-1"
                    placeholder="例：123-4567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prefecture" className="bg-blue-100 px-4 py-2 block">
                      都道府県
                    </Label>
                    <Input
                      id="prefecture"
                      value={formData.prefecture}
                      onChange={(e) => handleChange("prefecture", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="bg-blue-100 px-4 py-2 block">
                      市区町村
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="bg-blue-100 px-4 py-2 block">
                      場所名
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="building" className="bg-blue-100 px-4 py-2 block">
                      ビル名
                    </Label>
                    <Input
                      id="building"
                      value={formData.building}
                      onChange={(e) => handleChange("building", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="bg-blue-100 px-4 py-2 block">
                      電話番号
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="mt-1"
                      placeholder="例：03-1234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fax" className="bg-blue-100 px-4 py-2 block">
                      FAX番号
                    </Label>
                    <Input
                      id="fax"
                      value={formData.fax}
                      onChange={(e) => handleChange("fax", e.target.value)}
                      className="mt-1"
                      placeholder="例：03-1234-5679"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Label htmlFor="isActive" className="bg-blue-100 px-4 py-2">
                    無効フラグ
                  </Label>
                  <Checkbox
                    id="isActive"
                    checked={!formData.isActive}
                    onCheckedChange={(checked) => handleChange("isActive", !checked)}
                  />
                  <Label htmlFor="isActive">無効</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button type="submit" className="w-32">
            登録
          </Button>
          <Button type="button" variant="outline" className="w-32" onClick={() => router.push("/organizations")}>
            閉じる
          </Button>
        </div>
      </form>
    </div>
  )
}
