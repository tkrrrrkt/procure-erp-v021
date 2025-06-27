"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Box,
  Building,
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  Home,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  ListFilter,
  FilePlus,
  FileUp,
  FileQuestion,
  ArrowDownUp,
  Layers,
  Database,
  LineChart,
  LogOut,
  PackageCheck,
  Boxes,
  Search,
  Calendar,
  CreditCard,
  AlertTriangle,
  Warehouse,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: NavItem[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "purchase-orders": true,
    "purchase-requests": true,
    receiving: true,
    vendors: true,
    organizations: true,
    employees: true,
    products: true,
    inventory: true,
    "master-management": true,
    analysis: true,
    "price-management": true,
    warehouses: true,
  })

  const navItems: NavItem[] = [
    {
      title: "ダッシュボード",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "発注依頼",
      href: "/purchase-requests",
      icon: <FileQuestion className="h-5 w-5" />,
      submenu: [
        {
          title: "発注依頼入力",
          href: "/purchase-requests/new",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "発注依頼一覧",
          href: "/purchase-requests",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Web見積回答",
          href: "/supplier/quotation-responses",
          icon: <Globe className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "購買管理",
      href: "/purchase-orders",
      icon: <ShoppingCart className="h-5 w-5" />,
      submenu: [
        {
          title: "発注管理",
          href: "/purchase-orders",
          icon: <FileText className="h-4 w-4" />,
          submenu: [
            {
              title: "発注入力",
              href: "/purchase-orders/new",
              icon: <FileText className="h-4 w-4" />,
            },
            {
              title: "発注一覧",
              href: "/purchase-orders",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "発注データ取込",
              href: "/purchase-orders/import",
              icon: <FileUp className="h-4 w-4" />,
            },
            {
              title: "注文書発行",
              href: "/purchase-orders/issue",
              icon: <Printer className="h-4 w-4" />,
            },
            {
              title: "Web発注照会",
              href: "/purchase-orders/web-portal",
              icon: <Globe className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "入荷管理",
          href: "/receiving",
          icon: <Truck className="h-4 w-4" />,
          submenu: [
            {
              title: "入荷予定照会",
              href: "/receiving/arrivals/schedule",
              icon: <Calendar className="h-4 w-4" />,
            },
            {
              title: "入荷一覧",
              href: "/receiving/arrivals",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "入荷処理",
              href: "/receiving/arrivals/new",
              icon: <PackageCheck className="h-4 w-4" />,
            },
            {
              title: "一括入荷処理",
              href: "/receiving/arrivals/bulk",
              icon: <Boxes className="h-4 w-4" />,
            },
            {
              title: "仕入一覧",
              href: "/receiving",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "仕入入力",
              href: "/receiving/new",
              icon: <FileText className="h-4 w-4" />,
            },
            {
              title: "一括仕入処理",
              href: "/receiving/purchases/bulk",
              icon: <Boxes className="h-4 w-4" />,
            },
            {
              title: "請求書照合",
              href: "/invoice-matching/list",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "在庫管理",
          href: "/inventory",
          icon: <Box className="h-4 w-4" />,
          submenu: [
            {
              title: "在庫一覧",
              href: "/inventory",
              icon: <Layers className="h-4 w-4" />,
            },
            {
              title: "受払照会",
              href: "/inventory/transactions",
              icon: <ArrowDownUp className="h-4 w-4" />,
            },
            {
              title: "出庫入力",
              href: "/inventory/issue",
              icon: <LogOut className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "ECサイト価格検索",
          href: "/ec-price-search",
          icon: <Search className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "マスタ管理",
      href: "/master",
      icon: <Database className="h-5 w-5" />,
      submenu: [
        {
          title: "仕入先別単価",
          href: "/price-management/vendor-prices",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          title: "発注点管理",
          href: "/reorder-point",
          icon: <AlertTriangle className="h-4 w-4" />,
        },
        {
          title: "倉庫管理",
          href: "/warehouses",
          icon: <Warehouse className="h-4 w-4" />,
          submenu: [
            {
              title: "倉庫一覧",
              href: "/warehouses",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "倉庫登録",
              href: "/warehouses/new",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "取引先管理",
          href: "/vendors",
          icon: <Users className="h-4 w-4" />,
          submenu: [
            {
              title: "仕入先一覧",
              href: "/vendors",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "仕入先登録",
              href: "/vendors/new",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "組織管理",
          href: "/organizations",
          icon: <Building className="h-4 w-4" />,
          submenu: [
            {
              title: "組織一覧",
              href: "/organizations",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "組織登録",
              href: "/organizations/new",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "社員管理",
          href: "/employees",
          icon: <UserCircle className="h-4 w-4" />,
          submenu: [
            {
              title: "社員一覧",
              href: "/employees",
              icon: <ClipboardList className="h-4 w-4" />,
            },
            {
              title: "社員登録",
              href: "/employees/new",
              icon: <FileText className="h-4 w-4" />,
            },
          ],
        },
        {
          title: "商品管理",
          href: "/products",
          icon: <Package className="h-4 w-4" />,
          submenu: [
            {
              title: "商品一覧",
              href: "/products",
              icon: <ListFilter className="h-4 w-4" />,
            },
            {
              title: "商品登録",
              href: "/products/new",
              icon: <FilePlus className="h-4 w-4" />,
            },
          ],
        },
      ],
    },
    {
      title: "アナリシス",
      href: "/analysis",
      icon: <LineChart className="h-5 w-5" />,
      submenu: [
        {
          title: "レポート",
          href: "/reports",
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
  ]

  const toggleSubmenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0

    if (hasSubmenu) {
      return (
        <div>
          <button
            onClick={() => toggleSubmenu(item.title)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
              level === 0 ? "font-medium" : "",
              pathname.startsWith(item.href)
                ? "bg-muted text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-primary",
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.title}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", openMenus[item.title] ? "rotate-180" : "")} />
          </button>
          {openMenus[item.title] && (
            <div className="ml-4 mt-1 space-y-1">
              {item.submenu.map((subItem, subIndex) => (
                <div key={subIndex}>{renderNavItem(subItem, level + 1)}</div>
              ))}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
            level === 0 ? "font-medium" : "",
            pathname === item.href
              ? "bg-muted text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-primary",
          )}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      )
    }
  }

  return (
    <div className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm">
          {navItems.map((item, index) => (
            <div key={index}>{renderNavItem(item)}</div>
          ))}
        </nav>
      </div>
    </div>
  )
}
