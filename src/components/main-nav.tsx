'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  LineChart,
  Settings,
  Users2,
  Folder,
  Scale,
} from 'lucide-react'

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/icons'
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase'
import { useUserRole } from '@/hooks/use-user-role'
import { AppUser } from '@/lib/types'
import { collection, query, where } from 'firebase/firestore'

export function MainNav() {
  const pathname = usePathname()
  const { user, isUserLoading } = useUser();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const { state } = useSidebar();
  const firestore = useFirestore();

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), where("role", "==", "admin"))
  }, [firestore]);

  const { data: admins, isLoading: isAdminLoading } = useCollection<AppUser>(adminsQuery);

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  const isLoading = isUserLoading || isAdminLoading;
  
  const canSeeUserManagement = role === 'admin' || (!isLoading && admins?.length === 0);

  if (pathname.startsWith('/login')) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-primary" />
          {state === 'expanded' && <span className="whitespace-nowrap">Quản lý bán hàng</span>}
        </Link>
      </SidebarHeader>
      { (isUserLoading || !user) ? (
        <SidebarContent />
      ) : (
        <>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/dashboard')}
                  tooltip="Bảng điều khiển"
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Home />
                    <span className="whitespace-nowrap">Bảng điều khiển</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/categories')}
                  tooltip="Danh mục"
                >
                  <Link href="/categories" className="flex items-center gap-2">
                    <Folder />
                    <span className="whitespace-nowrap">Danh mục</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/units')}
                  tooltip="Đơn vị tính"
                >
                  <Link href="/units" className="flex items-center gap-2">
                    <Scale />
                    <span className="whitespace-nowrap">Đơn vị tính</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/products')}
                  tooltip="Sản phẩm"
                >
                  <Link href="/products" className="flex items-center gap-2">
                    <Package />
                    <span className="whitespace-nowrap">Sản phẩm</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/sales')}
                  tooltip="Bán hàng"
                >
                  <Link href="/sales" className="flex items-center gap-2">
                    <ShoppingCart />
                    <span className="whitespace-nowrap">Bán hàng</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/customers')}
                  tooltip="Khách hàng"
                >
                  <Link href="/customers" className="flex items-center gap-2">
                    <Users />
                    <span className="whitespace-nowrap">Khách hàng</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/reports')}
                  tooltip="Báo cáo"
                >
                  <Link href="/reports" className="flex items-center gap-2">
                    <LineChart />
                    <span className="whitespace-nowrap">Báo cáo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canSeeUserManagement && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/users')}
                    tooltip="Quản lý người dùng"
                  >
                    <Link href="/users" className="flex items-center gap-2">
                      <Users2 />
                      <span className="whitespace-nowrap">Quản lý người dùng</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/settings')}
                  tooltip="Cài đặt"
                >
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings />
                    <span className="whitespace-nowrap">Cài đặt</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  )
}
