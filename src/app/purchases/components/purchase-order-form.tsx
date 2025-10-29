'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from "@/components/ui/input"
import { Product, Unit, PurchaseOrderItem, PurchaseOrder } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, PlusCircle, Trash2, ChevronLeft } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { createPurchaseOrder } from '../actions'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Vui lòng chọn sản phẩm."),
  productName: z.string().optional(),
  quantity: z.coerce.number().min(0.01, "Số lượng phải lớn hơn 0."),
  cost: z.coerce.number().min(0, "Giá phải là số không âm."),
  unitId: z.string().min(1, "Đơn vị tính không được để trống."),
});

const purchaseOrderSchema = z.object({
  importDate: z.string().min(1, "Ngày nhập là bắt buộc."),
  items: z.array(purchaseOrderItemSchema).min(1, "Đơn nhập phải có ít nhất một sản phẩm."),
  notes: z.string().optional(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  products: Product[];
  units: Unit[];
  purchaseOrder?: PurchaseOrder;
}

const FormattedNumberInput = ({ value, onChange, ...props }: { value: number; onChange: (value: number) => void; [key: string]: any }) => {
  const [displayValue, setDisplayValue] = useState(value?.toLocaleString('en-US') || '');

  useEffect(() => {
    setDisplayValue(value?.toLocaleString('en-US') || '0');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const numberValue = parseInt(rawValue, 10);

    if (!isNaN(numberValue)) {
      setDisplayValue(numberValue.toLocaleString('en-US'));
      onChange(numberValue);
    } else if (rawValue === '') {
      setDisplayValue('');
      onChange(0);
    }
  };

  return <Input type="text" value={displayValue} onChange={handleChange} {...props} />;
};


export function PurchaseOrderForm({ products, units, purchaseOrder }: PurchaseOrderFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const unitsMap = useMemo(() => new Map(units.map(u => [u.id, u])), [units]);
  const productsMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      importDate: new Date().toISOString().split('T')[0],
      items: [],
      notes: '',
    },
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = form.watch("items");

  const totalAmount = watchedItems.reduce((acc, item) => {
    const { quantity = 0, cost = 0 } = item;
    return acc + (quantity * cost);
  }, 0);


  const onSubmit = async (data: PurchaseOrderFormValues) => {
    const result = await createPurchaseOrder({
        ...data,
        totalAmount
    });

    if (result.success) {
      toast({
        title: "Thành công!",
        description: `Đã tạo đơn nhập hàng thành công.`,
      });
      router.push('/purchases');
    } else {
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: result.error,
      });
    }
  };
  
  const addProductToOrder = (productId: string) => {
    const product = productsMap.get(productId);
    if (product) {
      if (watchedItems.some(item => item.productId === productId)) {
        toast({
          variant: "destructive",
          title: "Sản phẩm đã tồn tại",
          description: "Sản phẩm này đã có trong đơn hàng.",
        });
        return;
      }
      append({ 
        productId: product.id, 
        productName: product.name,
        quantity: 1, 
        cost: 0,
        unitId: product.unitId
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                <Link href="/purchases">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Quay lại</span>
                </Link>
            </Button>
            <div className="flex-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {purchaseOrder ? 'Chỉnh sửa đơn nhập hàng' : 'Tạo đơn nhập hàng mới'}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Điền thông tin để tạo một đợt nhập hàng mới cho nhiều sản phẩm.
                </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
                 <Button type="button" variant="outline" onClick={() => router.push('/purchases')}>
                    Hủy
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu đơn nhập'}
                </Button>
            </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-3 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết đơn nhập</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => {
                            const product = productsMap.get(watchedItems[index]?.productId);
                            const selectedUnit = unitsMap.get(watchedItems[index]?.unitId);
                            const itemTotal = (watchedItems[index]?.quantity || 0) * (watchedItems[index]?.cost || 0);
                            return (
                                <div key={field.id} className="p-4 border rounded-md relative space-y-3">
                                    <p className="font-semibold">{product?.name}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Số lượng</FormLabel>
                                                    <FormControl><Input type="number" step="any" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unitId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Đơn vị</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Chọn ĐVT" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            {units.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.cost`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Giá nhập / {selectedUnit?.name || 'ĐVT'}</FormLabel>
                                                    <FormControl><FormattedNumberInput {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <p className="text-right text-sm font-medium">Thành tiền: {formatCurrency(itemTotal)}</p>
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            )
                        })}
                        <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="mt-2">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Thêm sản phẩm
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Tìm kiếm sản phẩm..." />
                                    <CommandList>
                                        <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                                        <CommandGroup>
                                            {products.map((product) => (
                                            <CommandItem
                                                key={product.id}
                                                value={product.name}
                                                onSelect={() => {
                                                    addProductToOrder(product.id);
                                                    setProductSearchOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", watchedItems.some(i => i.productId === product.id) ? "opacity-100" : "opacity-0")} />
                                                {product.name}
                                            </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                         <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin chung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="importDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Ngày nhập hàng</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Tổng cộng</span>
                            <span>{formatCurrency(totalAmount)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  )
}
