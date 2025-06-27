"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// サンプルデータ
const departments = [
  { id: "00000", name: "全社" },
  { id: "01000", name: "一管理部" },
  { id: "02000", name: "一営業部" },
  { id: "03000", name: "一製作部" },
  { id: "03100", name: "企画・デザイン課" },
  { id: "03120", name: "大阪オフィス" },
  { id: "03200", name: "製作1課" },
  { id: "03210", name: "ダイレクト" },
  { id: "03300", name: "製作2課" },
  { id: "03310", name: "ビジュアル" },
  { id: "03320", name: "ターポリン" },
]

const roles = [
  { id: "1", name: "営業" },
  { id: "2", name: "製作" },
  { id: "3", name: "企画" },
  { id: "4", name: "管理" },
]

export default function EmployeeNewPage() {
  const [isInactive, setIsInactive] = useState(false)

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/employees">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">社員マスタ登録</h1>
        </div>
        <div className="text-sm text-muted-foreground">モード：新規</div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employeeCode" className="bg-blue-100 px-4 py-2 block">
                  社員コード
                </Label>
                <Input id="employeeCode" placeholder="社員コードを入力" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeName" className="bg-blue-100 px-4 py-2 block">
                  社員氏名
                </Label>
                <Input id="employeeName" placeholder="社員氏名を入力" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeKana" className="bg-blue-100 px-4 py-2 block">
                  社員カナ名
                </Label>
                <Input id="employeeKana" placeholder="社員カナ名を入力" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="bg-blue-100 px-4 py-2 block">
                  メールアドレス
                </Label>
                <Input id="email" type="email" placeholder="メールアドレスを入力" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="bg-blue-100 px-4 py-2 block">
                  所属部門
                </Label>
                <Select>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="bg-blue-100 px-4 py-2 block">
                  担当
                </Label>
                <Select>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="担当を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Label htmlFor="inactive" className="bg-blue-100 px-4 py-2">
                  有効/無効
                </Label>
                <Checkbox
                  id="inactive"
                  checked={isInactive}
                  onCheckedChange={(checked) => setIsInactive(checked as boolean)}
                />
                <Label htmlFor="inactive" className="font-normal">
                  無効
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/employees">
            <Button variant="outline">閉じる</Button>
          </Link>
          <Button>登録</Button>
        </div>
      </div>
    </div>
  )
}
