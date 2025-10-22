'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { upsertThemeSettings } from './actions'
import type { ThemeSettings } from '@/lib/types'

const themeFormSchema = z.object({
  primary: z.string().min(1, "Bắt buộc"),
  background: z.string().min(1, "Bắt buộc"),
  accent: z.string().min(1, "Bắt buộc"),
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'theme');
  }, [firestore]);

  const { data: themeSettings, isLoading } = useDoc<ThemeSettings>(settingsRef);
  
  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      primary: '24 95% 53%',
      background: '220 17% 95%',
      accent: '24 95% 53%',
    },
  });
  
  useEffect(() => {
    if (themeSettings) {
      form.reset({
        primary: themeSettings.primary,
        background: themeSettings.background,
        accent: themeSettings.accent,
      });
    }
  }, [themeSettings, form]);

  const onSubmit = async (data: ThemeFormValues) => {
    const result = await upsertThemeSettings(data);
    if (result.success) {
      toast({
        title: "Thành công!",
        description: "Đã cập nhật cài đặt giao diện.",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Ôi! Đã có lỗi xảy ra.",
        description: result.error,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Giao diện</CardTitle>
            <CardDescription>
              Tùy chỉnh màu sắc của ứng dụng. Cung cấp giá trị HSL (ví dụ: `24 95% 53%`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {isLoading && <p>Đang tải cài đặt...</p>}
            {!isLoading && (
              <>
                <FormField
                  control={form.control}
                  name="primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Màu chủ đạo (Primary)</FormLabel>
                      <FormControl>
                        <Input placeholder="ví dụ: 24 95% 53%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="background"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Màu nền (Background)</FormLabel>
                      <FormControl>
                        <Input placeholder="ví dụ: 220 17% 95%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="accent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Màu nhấn (Accent/Hover)</FormLabel>
                      <FormControl>
                        <Input placeholder="ví dụ: 24 95% 53%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
