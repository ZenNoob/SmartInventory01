'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { upsertProductUnitConfig, ProductUnitConfig } from '../actions';
import { Unit } from '@/hooks/use-units';

const formSchema = z.object({
  productId: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  baseUnitId: z.string().min(1, 'Vui lòng chọn đơn vị cơ sở'),
  conversionUnitId: z.string().min(1, 'Vui lòng chọn đơn vị quy đổi'),
  conversionRate: z.coerce.number().min(1, 'Hệ số quy đổi phải >= 1'),
  baseUnitPrice: z.coerce.number().min(0, 'Giá phải >= 0'),
  conversionUnitPrice: z.coerce.number().min(0, 'Giá phải >= 0'),
});

type FormValues = z.infer<typeof formSchema>;

interface Product {
  id: string;
  name: string;
  unitId?: string;
  price?: number;
}

interface ProductUnitFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ProductUnitConfig;
  products: Product[];
  units: Unit[];
  onSuccess: () => void;
}

export function ProductUnitForm({
  isOpen,
  onOpenChange,
  config,
  products,
  units,
  onSuccess,
}: ProductUnitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      baseUnitId: '',
      conversionUnitId: '',
      conversionRate: 1,
      baseUnitPrice: 0,
      conversionUnitPrice: 0,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        productId: config.productId,
        baseUnitId: config.baseUnitId,
        conversionUnitId: config.conversionUnitId,
        conversionRate: config.conversionRate,
        baseUnitPrice: config.baseUnitPrice,
        conversionUnitPrice: config.conversionUnitPrice,
      });
    } else {
      form.reset({
        productId: '',
        baseUnitId: '',
        conversionUnitId: '',
        conversionRate: 1,
        baseUnitPrice: 0,
        conversionUnitPrice: 0,
      });
    }
  }, [config, form, isOpen]);

  // Auto-fill base unit when product is selected
  const selectedProductId = form.watch('productId');
  useEffect(() => {
    if (selectedProductId && !config) {
      const product = products.find(p => p.id === selectedProductId);
      if (product?.unitId) {
        form.setValue('baseUnitId', product.unitId);
      }
      if (product?.price) {
        form.setValue('baseUnitPrice', product.price);
      }
    }
  }, [selectedProductId, products, config, form]);

  // Auto-calculate conversion unit price
  const baseUnitPrice = form.watch('baseUnitPrice');
  const conversionRate = form.watch('conversionRate');
  useEffect(() => {
    if (baseUnitPrice && conversionRate) {
      form.setValue('conversionUnitPrice', baseUnitPrice * conversionRate);
    }
  }, [baseUnitPrice, conversionRate, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const result = await upsertProductUnitConfig(values.productId, {
      baseUnitId: values.baseUnitId,
      conversionUnitId: values.conversionUnitId,
      conversionRate: values.conversionRate,
      baseUnitPrice: values.baseUnitPrice,
      conversionUnitPrice: values.conversionUnitPrice,
    });

    if (result.success) {
      toast({
        title: 'Thành công!',
        description: config ? 'Đã cập nhật quy đổi sản phẩm.' : 'Đã tạo quy đổi sản phẩm mới.',
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  const selectedBaseUnit = units.find(u => u.id === form.watch('baseUnitId'));
  const selectedConversionUnit = units.find(u => u.id === form.watch('conversionUnitId'));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Sửa quy đổi sản phẩm' : 'Thêm quy đổi sản phẩm'}
          </DialogTitle>
          <DialogDescription>
            Cấu hình đơn vị quy đổi cho sản phẩm (ví dụ: 1 Thùng = 24 Lon)
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sản phẩm</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!config}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị cơ sở</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Đơn vị nhỏ nhất (vd: Lon, Cái)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conversionUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị quy đổi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units
                          .filter((u) => u.id !== form.watch('baseUnitId'))
                          .map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Đơn vị lớn hơn (vd: Thùng, Hộp)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="conversionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hệ số quy đổi</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    1 {selectedConversionUnit?.name || 'đơn vị quy đổi'} = {field.value}{' '}
                    {selectedBaseUnit?.name || 'đơn vị cơ sở'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseUnitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá / {selectedBaseUnit?.name || 'đơn vị cơ sở'}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conversionUnitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá / {selectedConversionUnit?.name || 'đơn vị quy đổi'}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : config ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
