"use client"

import { Bell, HelpCircle, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-primary">ProcureERP</h1>
      </div>
      <div className="hidden flex-1 px-4 md:flex md:max-w-md lg:max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="検索..." className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 p-0 flex items-center justify-center">3</Badge>
              <span className="sr-only">通知</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>通知</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">発注書 #PO-2023-0458 が承認されました</p>
                <p className="text-xs text-muted-foreground">10分前</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">納品予定日の変更: #PO-2023-0442</p>
                <p className="text-xs text-muted-foreground">1時間前</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">価格変更の承認が必要です</p>
                <p className="text-xs text-muted-foreground">3時間前</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">ヘルプ</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">設定</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="ユーザー" />
                <AvatarFallback>TK</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>田中 健太</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>プロフィール</DropdownMenuItem>
            <DropdownMenuItem>設定</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>ログアウト</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
