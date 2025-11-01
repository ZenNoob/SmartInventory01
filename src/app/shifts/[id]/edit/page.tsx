
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import type { Shift } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { updateShift } from '@/app/pos/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/formatted-number-input'

const shiftFormSchema = z.object({
  startingCash: z.coerce.number().min(0, "Số tiền không được âm."),
  endingCash: z.coerce.number().min(0, "Số tiền không được âm."),
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export default function EditShiftPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const shiftRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'shifts', params.id) : null),
    [firestore, params.id]
  );
  const { data: shift, isLoading: shiftLoading } = useDoc<Shift>(shiftRef);

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
  });

  useEffect(() => {
    if (shift) {
      form.reset({
        startingCash: shift.startingCash,
        endingCash: shift.endingCash || 0,
      });
    }
  }, [shift, form]);

  const onSubmit = async (data: ShiftFormValues) => {
    if (!shift) return;

    const result = await updateShift(shift.id, data);
    if (result.success) {
      toast({
        title: "Thành công!",
        description: "Đã cập nhật thông tin ca làm việc.",
      });
      router.push(`/shifts/${shift.id}`);
      router.refresh(); // Ensure server component data is re-fetched
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: result.error,
      });
    }
  };

  if (shiftLoading) {
    return <div className="flex justify-center items-center h-full"><p>Đang tải ca làm việc...</p></div>;
  }

  if (!shift) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href={`/shifts/${shift.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Quay lại</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Chỉnh sửa Ca làm việc</h1>
          <p className="text-sm text-muted-foreground">
            Điều chỉnh lại số tiền đầu ca và cuối ca cho ca của {shift.userName}.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Thông tin ca</CardTitle>
              <CardDescription>
                Chỉ tiền đầu ca và cuối ca có thể được chỉnh sửa. Các số liệu khác sẽ được tự động tính toán lại.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="startingCash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiền đầu ca</FormLabel>
                    <FormControl>
                      <FormattedNumberInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endingCash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiền cuối ca (Thực tế)</FormLabel>
                    <FormControl>
                      <FormattedNumberInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <div className='p-6 flex justify-end'>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
