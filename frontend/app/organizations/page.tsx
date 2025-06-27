"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight, Filter, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 組織データの型定義
interface Organization {
  id: string
  code: string
  name: string
  shortName: string
  parentId: string | null
  parentName: string
  isActive: boolean
  level: number
  children?: Organization[]
}

// サンプルデータ
const organizationsData: Organization[] = [
  {
    id: "1",
    code: "00000",
    name: "全社",
    shortName: "全社",
    parentId: null,
    parentName: "全社",
    isActive: true,
    level: 0,
  },
  {
    id: "2",
    code: "01000",
    name: "一管理部",
    shortName: "一管理部",
    parentId: "1",
    parentName: "全社",
    isActive: true,
    level: 1,
  },
  {
    id: "3",
    code: "02000",
    name: "一営業部",
    shortName: "一営業部",
    parentId: "1",
    parentName: "全社",
    isActive: true,
    level: 1,
  },
  {
    id: "4",
    code: "03000",
    name: "一製作部",
    shortName: "一製作部",
    parentId: "1",
    parentName: "全社",
    isActive: false,
    level: 1,
  },
  {
    id: "5",
    code: "03100",
    name: "一一企画・デザイン課",
    shortName: "一一企画・デザイン課",
    parentId: "4",
    parentName: "一製作部",
    isActive: true,
    level: 2,
  },
  {
    id: "6",
    code: "03120",
    name: "一一一大阪オフィス",
    shortName: "一一一大阪オフィス",
    parentId: "5",
    parentName: "一一企画・デザイン課",
    isActive: true,
    level: 3,
  },
  {
    id: "7",
    code: "03200",
    name: "一一製作1課",
    shortName: "一一製作1課",
    parentId: "4",
    parentName: "一製作部",
    isActive: true,
    level: 2,
  },
  {
    id: "8",
    code: "03210",
    name: "一一一ディレクション",
    shortName: "一一一ディレクション",
    parentId: "7",
    parentName: "一一製作1課",
    isActive: true,
    level: 3,
  },
  {
    id: "9",
    code: "03300",
    name: "一一製作2課",
    shortName: "一一製作2課",
    parentId: "4",
    parentName: "一製作部",
    isActive: true,
    level: 2,
  },
  {
    id: "10",
    code: "03310",
    name: "一一一ビジュアル",
    shortName: "一一一ビジュアル",
    parentId: "9",
    parentName: "一一製作2課",
    isActive: true,
    level: 3,
  },
  {
    id: "11",
    code: "03320",
    name: "一一一ターポリン",
    shortName: "一一一ターポリン",
    parentId: "9",
    parentName: "一一製作2課",
    isActive: true,
    level: 3,
  },
]

// 階層構造に変換する関数
function buildTree(items: Organization[]): Organization[] {
  const itemMap: Record<string, Organization> = {}
  const roots: Organization[] = []

  // 全アイテムをマップに追加
  items.forEach((item) => {
    itemMap[item.id] = { ...item, children: [] }
  })

  // 親子関係を構築
  items.forEach((item) => {
    if (item.parentId === null) {
      roots.push(itemMap[item.id])
    } else if (itemMap[item.parentId]) {
      itemMap[item.parentId].children = itemMap[item.parentId].children || []
      itemMap[item.parentId].children?.push(itemMap[item.id])
    }
  })

  return roots
}

// ツリーノードコンポーネント
function TreeNode({
  node,
  expanded,
  toggleExpand,
  level = 0,
}: {
  node: Organization
  expanded: Record<string, boolean>
  toggleExpand: (id: string) => void
  level?: number
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded[node.id]
  const paddingLeft = `${level * 20}px`

  return (
    <>
      <TableRow className={node.isActive ? "" : "opacity-60"}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(node.id)} className="mr-1 p-1 rounded-full hover:bg-gray-200">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-6"></span>
            )}
            {node.code}
          </div>
        </TableCell>
        <TableCell>{node.shortName}</TableCell>
        <TableCell>{node.parentName}</TableCell>
        <TableCell>
          <Badge variant={node.isActive ? "success" : "destructive"}>{node.isActive ? "有効" : "無効"}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/organizations/edit/${node.id}`}>編集</Link>
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded &&
        node.children &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} expanded={expanded} toggleExpand={toggleExpand} level={level + 1} />
        ))}
    </>
  )
}

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "1": true, // 初期状態で全社を展開
  })

  // 検索とフィルタリング
  const filteredOrganizations = organizationsData.filter((org) => {
    const matchesSearch =
      org.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.shortName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && org.isActive) ||
      (statusFilter === "inactive" && !org.isActive)

    return matchesSearch && matchesStatus
  })

  // ツリー構造に変換
  const treeData = buildTree(filteredOrganizations)

  // 展開状態の切り替え
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // 全て展開/折りたたみ
  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {}
    organizationsData.forEach((org) => {
      allExpanded[org.id] = true
    })
    setExpanded(allExpanded)
  }

  const collapseAll = () => {
    setExpanded({})
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">組織マスタ</h1>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
          <CardTitle>組織一覧</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="組織コード・名称で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                すべて展開
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                すべて折りたたむ
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gradient-to-r from-sky-50 to-blue-100">
                <TableRow>
                  <TableHead className="w-[150px]">部門コード</TableHead>
                  <TableHead>部門略名</TableHead>
                  <TableHead>上位部門略名</TableHead>
                  <TableHead>有効/無効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treeData.length > 0 ? (
                  treeData.map((org) => (
                    <TreeNode key={org.id} node={org} expanded={expanded} toggleExpand={toggleExpand} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      該当する組織が見つかりません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
