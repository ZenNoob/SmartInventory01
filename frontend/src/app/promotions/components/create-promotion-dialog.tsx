'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api-client'

interface CreatePromotionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreatePromotionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePromotionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: 0,
    minPurchaseAmount: 0,
    buyQuantity: 2,
    getQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    usageLimit: 0,
    priority: 0,
    applyTo: 'all',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await apiClient.request('/promotions', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          status: 'active',
          usageLimit: formData.usageLimit || null,
          maxDiscountAmount: formData.maxDiscountAmount || null,
          minPurchaseAmount: formData.minPurchaseAmount || null,
        }),
      })

      toast({
        title: 'Thành công',
        description: 'Đã tạo chương trình khuyến mãi',
      })

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'percentage',
        discountType: 'percentage',
        discountValue: 0,
        maxDiscountAmount: 0,
        minPurchaseAmount: 0,
        buyQuantity: 2,
        getQuantity: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        usageLimit: 0,
        priority: 0,
        applyTo: 'all',
      })
    } catch (error) {
      console.error('Create promotion error:', error)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tạo khuyến mãi',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo chương trình khuyến mãi</DialogTitle>
          <DialogDescription>
            Tạo chương trình khuyến mãi mới cho cửa hàng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên chương trình *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Loại khuyến mãi</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Giảm theo %</SelectItem>
                <SelectItem value="fixed_amount">Giảm số tiền cố định</SelectItem>
                <SelectItem value="buy_x_get_y">Mua X tặng Y</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {formData.type === 'percentage' ? 'Giảm giá (%)' : 'Giảm giá (VNĐ)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: parseFloat(e.target.value),
                      discountType: formData.type === 'percentage' ? 'percentage' : 'fixed',
                    })
                  }
                  required
                />
              </div>

              {formData.type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Giảm tối đa (VNĐ)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              )}
            </>
          )}

          {formData.type === 'buy_x_get_y' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyQty">Mua (số lượng)</Label>
                <Input
                  id="buyQty"
                  type="number"
                  value={formData.buyQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      buyQuantity: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="getQty">Tặng (số lượng)</Label>
                <Input
                  id="getQty"
                  type="number"
                  value={formData.getQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      getQuantity: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="minPurchase">Đơn hàng tối thiểu (VNĐ)</Label>
            <Input
              id="minPurchase"
              type="number"
              value={formData.minPurchaseAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minPurchaseAmount: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usageLimit">Giới hạn sử dụng (0 = không giới hạn)</Label>
            <Input
              id="usageLimit"
              type="number"
              value={formData.usageLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  usageLimit: parseInt(e.target.value),
                })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo khuyến mãi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
