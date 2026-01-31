'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QrCode, Wallet, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PaymentGatewayDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (gateway: string, transactionId?: string) => void;
  amount: number;
  orderId: string;
  orderInfo: string;
}

interface InstallmentOption {
  provider: string;
  providerName: string;
  term: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  interestRate: number;
}

export function PaymentGatewayDialog({
  open,
  onClose,
  onSuccess,
  amount,
  orderId,
  orderInfo,
}: PaymentGatewayDialogProps) {
  const [availableGateways, setAvailableGateways] = useState<string[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>('vnpay');
  const [isLoading, setIsLoading] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAvailableGateways();
      loadInstallmentOptions();
    }
  }, [open, amount]);

  const loadAvailableGateways = async () => {
    try {
      const response = await fetch('/api/payment-gateway/available');
      const result = await response.json();
      if (result.success) {
        setAvailableGateways(result.gateways);
        if (result.gateways.length > 0) {
          setSelectedGateway(result.gateways[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load gateways:', error);
    }
  };

  const loadInstallmentOptions = async () => {
    try {
      const response = await fetch(`/api/payment-gateway/installment/options?amount=${amount}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      if (result.success && result.options) {
        setInstallmentOptions(result.options);
      }
    } catch (error) {
      console.error('Failed to load installment options:', error);
    }
  };

  const handlePayment = async (gateway: string, installment?: { provider: string; term: number }) => {
    setIsLoading(true);
    try {
      let endpoint = '';
      let body: any = {
        orderId,
        amount,
        orderInfo,
      };

      if (installment) {
        endpoint = '/api/payment-gateway/installment/create';
        body.provider = installment.provider;
        body.term = installment.term;
      } else {
        endpoint = `/api/payment-gateway/${gateway}/create`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Open payment URL in new window
        window.open(result.paymentUrl, '_blank');
        
        toast({
          title: 'Đang chuyển đến cổng thanh toán',
          description: 'Vui lòng hoàn tất thanh toán trong cửa sổ mới',
        });

        // For demo, auto-confirm after 3 seconds
        setTimeout(() => {
          onSuccess(gateway, 'DEMO_TRANSACTION_' + Date.now());
          onClose();
        }, 3000);
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể tạo thanh toán',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến cổng thanh toán',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const gatewayInfo: Record<string, { name: string; icon: any; color: string }> = {
    vnpay: {
      name: 'VNPay',
      icon: QrCode,
      color: 'bg-blue-500',
    },
    momo: {
      name: 'MoMo',
      icon: Wallet,
      color: 'bg-pink-500',
    },
    zalopay: {
      name: 'ZaloPay',
      icon: QrCode,
      color: 'bg-blue-600',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Thanh toán trực tuyến</DialogTitle>
          <DialogDescription>
            Số tiền: <span className="font-bold text-lg text-primary">{amount.toLocaleString('vi-VN')} đ</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gateway" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gateway">Cổng thanh toán</TabsTrigger>
            <TabsTrigger value="installment">Trả góp</TabsTrigger>
          </TabsList>

          <TabsContent value="gateway" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {availableGateways.map((gateway) => {
                const info = gatewayInfo[gateway];
                if (!info) return null;

                const Icon = info.icon;
                return (
                  <button
                    key={gateway}
                    onClick={() => setSelectedGateway(gateway)}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                      selectedGateway === gateway
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn('p-3 rounded-full text-white mb-2', info.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm">{info.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Ngân hàng (tùy chọn)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  <SelectItem value="VIETCOMBANK">Vietcombank</SelectItem>
                  <SelectItem value="TECHCOMBANK">Techcombank</SelectItem>
                  <SelectItem value="BIDV">BIDV</SelectItem>
                  <SelectItem value="VIETINBANK">VietinBank</SelectItem>
                  <SelectItem value="AGRIBANK">Agribank</SelectItem>
                  <SelectItem value="MB">MB Bank</SelectItem>
                  <SelectItem value="ACB">ACB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => handlePayment(selectedGateway)}
              disabled={isLoading || !selectedGateway}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Thanh toán ngay'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="installment" className="space-y-4">
            {installmentOptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Đơn hàng chưa đủ điều kiện trả góp</p>
                <p className="text-sm">Số tiền tối thiểu: 5.000.000 đ</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Chọn gói trả góp</Label>
                  <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn gói trả góp" />
                    </SelectTrigger>
                    <SelectContent>
                      {installmentOptions.map((option, index) => (
                        <SelectItem key={index} value={`${option.provider}-${option.term}`}>
                          {option.providerName} - {option.term} tháng
                          {option.interestRate === 0 && ' (0% lãi suất)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInstallment && (() => {
                  const [provider, term] = selectedInstallment.split('-');
                  const option = installmentOptions.find(
                    (o) => o.provider === provider && o.term === parseInt(term)
                  );
                  if (!option) return null;

                  return (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Trả mỗi tháng:</span>
                        <span className="font-semibold">{option.monthlyPayment.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tổng phải trả:</span>
                        <span className="font-semibold">{option.totalAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      {option.totalInterest > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Lãi suất:</span>
                          <span className="text-sm">{option.totalInterest.toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Button
                  onClick={() => {
                    if (selectedInstallment) {
                      const [provider, term] = selectedInstallment.split('-');
                      handlePayment('installment', { provider, term: parseInt(term) });
                    }
                  }}
                  disabled={isLoading || !selectedInstallment}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Thanh toán trả góp'
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
