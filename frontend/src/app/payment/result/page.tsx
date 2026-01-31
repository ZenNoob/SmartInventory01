'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const success = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';
  const transactionId = searchParams.get('transactionId') || '';
  const message = searchParams.get('message') || '';

  useEffect(() => {
    // Simulate processing
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {success ? (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Thanh toán thành công!</CardTitle>
              <CardDescription>Giao dịch của bạn đã được xử lý thành công</CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Thanh toán thất bại</CardTitle>
              <CardDescription>Giao dịch không thành công. Vui lòng thử lại</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Mã đơn hàng:</span>
              <span className="font-medium">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Số tiền:</span>
              <span className="font-medium">{parseInt(amount).toLocaleString('vi-VN')} đ</span>
            </div>
            {transactionId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mã giao dịch:</span>
                <span className="font-medium text-xs">{transactionId}</span>
              </div>
            )}
            {message && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Thông báo:</span>
                <span className="text-sm">{message}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/pos')} className="flex-1">
              Quay lại POS
            </Button>
            <Button onClick={() => router.push('/sales')} className="flex-1">
              Xem đơn hàng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
