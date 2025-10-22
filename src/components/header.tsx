'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { PanelLeft, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UserNav } from './user-nav'
import Link from 'next/link'
import { Logo } from './icons'
import { usePathname } from 'next/navigation'
import { useUser } from '@/firebase'
import { SidebarTrigger } from './ui/sidebar'

export function Header() {
  const pathname = usePathname()
  const { user, isUserLoading } = useUser()

  if (pathname.startsWith('/login')) {
    return null;
  }
  
  if (isUserLoading || !user) {
    return (
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6" />
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger />
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <UserNav />
    </header>
  )
}
