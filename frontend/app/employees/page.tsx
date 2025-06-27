"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, FileDown } from "lucide-react"
import Link from "next/link"

// サンプルデータ
const employees = [
  {
    id: "200002",
    name: "大西 成寿",
    kana: "オニシ ナリヒサ",
    role: "製作",
    email: "onishi@asida.co.jp",
    department: "製作部",
    active: true,
  },
  {
    id: "200003",
    name: "塩見 大介",
    kana: "シオミ ダイスケ",
    role: "製作",
    email: "",
    department: "ビジュアル",
    active: true,
  },
  {
    id: "200005",
    name: "森奥 良充",
    kana: "モリオク ヨシミツ",
    role: "営業",
    email: "morioku@asida.co.jp",
    department: "営業部",
    active: true,
  },
  {
    id: "200008",
    name: "戸田 真弓",
    kana: "アシダ マユミ",
    role: "製作",
    email: "mayumi.a@asida.co.jp",
    department: "企画・デザイン課",
    active: true,
  },
  {
    id: "200009",
    name: "戸田 典之",
    kana: "アシダ ノリユキ",
    role: "製作",
    email: "noriyuki@asida.co.jp",
    department: "製作部",
    active: true,
  },
  {
    id: "200011",
    name: "須田 久美子",
    kana: "スダ クミコ",
    role: "企画",
    email: "suda@asida.co.jp",
    department: "企画・デザイン課",
    active: true,
  },
  {
    id: "200012",
    name: "古田 雄一郎",
    kana: "フルタ ユウイチロウ",
    role: "管理",
    email: "furuta@asida.co.jp",
    department: "管理部",
    active: true,
  },
]

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  // 部門リスト（重複を排除）
  const departments = [...new Set(employees.map((employee) => employee.department))]

  // 担当リスト（重複を排除）
  const roles = [...new Set(employees.map((employee) => employee.role))]

  // フィルタリングされた社員リスト
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.kana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.active) ||
      (statusFilter === "inactive" && !employee.active)

    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter

    const matchesRole = roleFilter === "all" || employee.role === roleFilter

    return matchesSearch && matchesStatus && matchesDepartment && matchesRole
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">社員一覧</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            エクスポート
          </Button>
          <Link href="/employees/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新規登録
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>検索とフィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="社員コード、名前、メールで検索"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="active">有効</SelectItem>
                <SelectItem value="inactive">無効</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="部門" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての部門</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="担当" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての担当</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-violet-50 to-purple-100">
              <TableRow>
                <TableHead className="w-[100px]">社員コード</TableHead>
                <TableHead>社員名</TableHead>
                <TableHead>社員カナ名</TableHead>
                <TableHead>担当</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>部門略名</TableHead>
                <TableHead className="w-[100px]">有効フラグ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.kana}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${employee.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {employee.active ? "有効" : "無効"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    該当する社員が見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="text-sm text-muted-foreground">行: {filteredEmployees.length}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
