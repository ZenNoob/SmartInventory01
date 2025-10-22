'use client'

import {
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCollection, useFirestore } from "@/firebase"
import { collection, query } from "firebase/firestore"
import { AppUser } from "@/lib/types"
import { UserForm } from "./components/user-form"
import { useState } from "react"
import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"

function getRoleVietnamese(role: string) {
  switch (role) {
    case 'admin':
      return 'Quản trị viên';
    case 'accountant':
      return 'Kế toán';
    case 'inventory_manager':
      return 'Quản lý kho';
    default:
      return role;
  }
}

export default function UsersPage() {
  const { role } = useUserRole();
  const router = useRouter();

  const firestore = useFirestore();
  const usersQuery = query(collection(firestore, "users"));
  const { data: users, isLoading } = useCollection<AppUser>(usersQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | undefined>(undefined);

  if (role && role !== 'admin') {
    router.push('/dashboard');
    return null;
  }
  
  const handleAddUser = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  }

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  }

  return (
    <div>
      <UserForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
      />
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1" onClick={handleAddUser}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Thêm người dùng
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Người dùng</CardTitle>
          <CardDescription>
            Danh sách tất cả người dùng trong hệ thống của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hiển thị</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>
                  <span className="sr-only">Hành động</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Đang tải...</TableCell>
                </TableRow>
              )}
              {!isLoading && users?.map((user) => {
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.displayName || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRoleVietnamese(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Chuyển đổi menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            Sửa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Hiển thị <strong>1-{users?.length || 0}</strong> trên <strong>{users?.length || 0}</strong> người dùng
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
