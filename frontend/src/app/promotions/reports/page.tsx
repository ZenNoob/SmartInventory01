'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Tag, Calendar } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PromotionReport {
  id: string
  name: string
  type: string
  usageCount: number
  totalDiscount: number
  affectedSales: number
  averageOrderValue: number
  status: string
}

export default function PromotionReportsPage() {
  const [reports, setReports] = useState<PromotionReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [dateFrom, dateTo])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement API endpoint
      // const response = await apiClient.request('/promotions/reports', {
      //   method: 'GET',
      //   params: { dateFrom, dateTo }
      // })
      // setReports(response.data || [])
      
      // Mock data for demo
      setReports([
        {
          id: '1',
          name: 'Giảm 10% cho đơn từ 500k',
          type: 'percentage',
          usageCount: 45,
          totalDiscount: 2500000,
          affectedSales: 45,
          averageOrderValue: 650000,
          status: 'active',
        },
        {
          id: '2',
          name: 'Mua 2 tặng 1',
          type: 'buy_x_get_y',
          usageCount: 23,
          totalDiscount: 1800000,
          affectedSales: 23,
          averageOrderValue: 450000,
          status: 'active',
        },
      ])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải báo cáo',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalUsage = reports.reduce((sum, r) => sum + r.usageCount, 0)
  const totalDiscount = reports.reduce((sum, r) => sum + r.totalDiscount, 0)
  const totalSales = reports.reduce((sum, r) => sum + r.affectedSales, 0)
  const avgOrderValue = totalSales > 0 
    ? reports.reduce((sum, r) => sum + r.averageOrderValue * r.affectedSales, 0) / totalSales
    : 0

  const getTypeText = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Giảm %'
      case 'fixed_amount':
        return 'Giảm tiền'
      case 'buy_x_get_y':
        return 'Mua X tặng Y'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo khuyến mãi</h1>
        <p className="text-muted-foreground">
          Phân tích hiệu quả các chương trình khuyến mãi
        </p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="dateFrom">Từ ngày</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo">Đến ngày</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt sử dụng</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Từ {reports.length} chương trình
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giảm giá</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDiscount)}</div>
            <p className="text-xs text-muted-foreground">
              Chi phí khuyến mãi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hàng áp dụng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Đơn hàng có khuyến mãi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giá trị TB/đơn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Trung bình đơn hàng
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết theo chương trình</CardTitle>
          <CardDescription>
            Hiệu quả từng chương trình khuyến mãi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên chương trình</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Lượt dùng</TableHead>
                <TableHead className="text-right">Tổng giảm</TableHead>
                <TableHead className="text-right">Đơn hàng</TableHead>
                <TableHead className="text-right">TB/đơn</TableHead>
                <TableHead className="text-right">Hiệu quả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Không có dữ liệu trong khoảng thời gian này
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => {
                  const efficiency = report.totalDiscount > 0
                    ? (report.averageOrderValue * report.affectedSales) / report.totalDiscount
                    : 0
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeText(report.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.usageCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(report.totalDiscount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {report.affectedSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.averageOrderValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={efficiency >= 3 ? 'default' : efficiency >= 2 ? 'secondary' : 'destructive'}
                        >
                          {efficiency.toFixed(1)}x
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
