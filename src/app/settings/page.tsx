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
import { hexToHsl, hslToHex } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const themeFormSchema = z.object({
  primary: z.string().min(1, "Bắt buộc"),
  primaryForeground: z.string().min(1, "Bắt buộc"),
  background: z.string().min(1, "Bắt buộc"),
  foreground: z.string().min(1, "Bắt buộc"),
  accent: z.string().min(1, "Bắt buộc"),
  accentForeground: z.string().min(1, "Bắt buộc"),
  lowStockThreshold: z.coerce.number().min(0, "Ngưỡng phải là số dương."),
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
      primary: '#ff6600',
      primaryForeground: '#111827',
      background: '#f2f5f9',
      foreground: '#111827',
      accent: '#ff6600',
      accentForeground: '#111827',
      lowStockThreshold: 10,
    },
  });
  
  useEffect(() => {
    if (themeSettings) {
      form.reset({
        primary: hslToHex(themeSettings.primary),
        primaryForeground: hslToHex(themeSettings.primaryForeground),
        background: hslToHex(themeSettings.background),
        foreground: hslToHex(themeSettings.foreground),
        accent: hslToHex(themeSettings.accent),
        accentForeground: hslToHex(themeSettings.accentForeground),
        lowStockThreshold: themeSettings.lowStockThreshold || 10,
      });
    }
  }, [themeSettings, form]);

  const onSubmit = async (data: ThemeFormValues) => {
    const hslData: ThemeSettings = {
      primary: hexToHsl(data.primary),
      primaryForeground: hexToHsl(data.primaryForeground),
      background: hexToHsl(data.background),
      foreground: hexToHsl(data.foreground),
      accent: hexToHsl(data.accent),
      accentForeground: hexToHsl(data.accentForeground),
      lowStockThreshold: data.lowStockThreshold,
    };
    const result = await upsertThemeSettings(hslData);
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

  const ColorField = ({ name, label }: { name: keyof Omit<ThemeFormValues, 'lowStockThreshold'>, label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-4">
            <FormControl>
              <Input type="color" {...field} className="w-16 h-10 p-1" />
            </FormControl>
            <span className="text-sm text-muted-foreground font-mono">{field.value}</span>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
            <CardDescription>
              Tùy chỉnh giao diện và các cài đặt chung cho ứng dụng của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
             {isLoading && <p>Đang tải cài đặt...</p>}
            {!isLoading && (
              <>
                <div>
                    <h3 className="text-lg font-medium">Giao diện</h3>
                    <p className="text-sm text-muted-foreground mb-6">Tùy chỉnh màu sắc của ứng dụng.</p>
                    <div className='space-y-8'>
                        <div className='grid md:grid-cols-2 gap-8'>
                            <ColorField name="background" label="Màu nền (Background)" />
                            <ColorField name="foreground" label="Màu chữ (Foreground)" />
                        </div>
                        <Separator />
                        <div className='grid md:grid-cols-2 gap-8'>
                            <ColorField name="primary" label="Màu chủ đạo (Primary)" />
                            <ColorField name="primaryForeground" label="Chữ trên màu chủ đạo" />
                        </div>
                        <Separator />
                        <div className='grid md:grid-cols-2 gap-8'>
                            <ColorField name="accent" label="Màu nhấn (Accent/Hover)" />
                            <ColorField name="accentForeground" label="Chữ trên màu nhấn" />
                        </div>
                    </div>
                </div>
                <Separator />
                <div>
                     <h3 className="text-lg font-medium">Hàng tồn kho</h3>
                    <p className="text-sm text-muted-foreground mb-6">Cài đặt liên quan đến quản lý hàng tồn kho.</p>
                     <FormField
                        control={form.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                            <FormItem className="max-w-xs">
                            <FormLabel>Ngưỡng cảnh báo tồn kho</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Ví dụ: 10" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
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
