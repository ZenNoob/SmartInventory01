'use client'

import { PanelLeft, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useUser } from '@/firebase'
import { UserNav } from './user-nav'

export function Header() {
  const pathname = usePathname()
  const { user, isUserLoading } = useUser()

  if (pathname.startsWith('/login')) {
    return null;
  }
  
  if (isUserLoading || !user) {
    return (
       <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6" />
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 shadow-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:rounded-lg">
      <SidebarTrigger className="sm:hidden">
        <PanelLeft />
      </SidebarTrigger>
      
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hidden sm:flex">
            <PanelLeft />
        </SidebarTrigger>
        <div className="relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
      </div>
      
      <div className="ml-auto">
        <UserNav />
      </div>
    </header>
  )
}
