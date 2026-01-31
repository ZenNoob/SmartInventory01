'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Package, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface Bundle {
  id: string
  name: string
  description?: string
  bundlePrice: number
  originalPrice?: number
  startDate: string
  endDate: string
  status: string
  products?: Array<{
    productId: string
    productName: string
    quantity: number
  }>
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchBundles()
  }, [])

  const fetchBundles = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement API endpoint
      // const response = await apiClient.request('/bundles', { method: 'GET' })
      // setBundles(response.data || [])
      setBundles([])
    } catch (error) {
      console.error('Error fetching bundles:', error)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách combo',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSavings = (bundle: Bundle) => {
    if (!bundle.originalPrice) return 0
    return bundle.originalPrice - bundle.bundlePrice
  }

  const getSavingsPercent = (bundle: Bundle) => {
    if (!bundle.originalPrice) return 0
    return Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Combo sản phẩm</h1>
          <p className="text-muted-foreground">
            Quản lý các gói combo và bundle deals
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo combo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bundles.filter((b) => b.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng combo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bundles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiết kiệm trung bình</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bundles.length > 0
                ? Math.round(
                    bundles.reduce((sum, b) => sum + getSavingsPercent(b), 0) /
                      bundles.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách combo</CardTitle>
          <CardDescription>
            Quản lý tất cả gói combo sản phẩm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên combo</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Giá gốc</TableHead>
                <TableHead>Giá combo</TableHead>
                <TableHead>Tiết kiệm</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : bundles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Chưa có combo nào</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Tạo combo để bán nhiều sản phẩm với giá ưu đãi
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {bundle.name}
                        </div>
                        {bundle.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {bundle.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bundle.products && bundle.products.length > 0 ? (
                        <div className="text-sm">
                          {bundle.products.map((p, idx) => (
                            <div key={idx}>
                              {p.quantity}x {p.productName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {bundle.originalPrice ? (
                        <span className="line-through text-muted-foreground">
                          {formatCurrency(bundle.originalPrice)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(bundle.bundlePrice)}
                    </TableCell>
                    <TableCell>
                      {bundle.originalPrice && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          -{getSavingsPercent(bundle)}% ({formatCurrency(getSavings(bundle))})
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(bundle.startDate), 'dd/MM/yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(bundle.endDate), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={bundle.status === 'active' ? 'default' : 'secondary'}
                      >
                        {bundle.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
