'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Store, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface SubscriptionPlan {
  id: string;
  name: string;
  maxStores: number;
  price: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Gói Cơ Bản',
    maxStores: 3,
    price: 0,
    icon: <Store className="h-6 w-6" />,
    features: [
      'Tối đa 3 cửa hàng',
      'Quản lý sản phẩm không giới hạn',
      'Quản lý bán hàng cơ bản',
      'Báo cáo doanh thu',
      'Quản lý tồn kho',
      'Hỗ trợ qua email',
    ],
  },
  {
    id: 'pro',
    name: 'Gói Chuyên Nghiệp',
    maxStores: 10,
    price: 500000,
    icon: <Zap className="h-6 w-6" />,
    popular: true,
    features: [
      'Tối đa 10 cửa hàng',
      'Tất cả tính năng Gói Cơ Bản',
      'Báo cáo nâng cao (lợi nhuận, công nợ)',
      'Phân tích xu hướng bán hàng',
      'Quản lý nhân viên & phân quyền',
      'Xuất dữ liệu Excel',
      'Hỗ trợ ưu tiên',
    ],
  },
  {
    id: 'enterprise',
    name: 'Gói Doanh Nghiệp',
    maxStores: 999,
    price: 2000000,
    icon: <Crown className="h-6 w-6" />,
    features: [
      'Không giới hạn cửa hàng',
      'Tất cả tính năng Gói Chuyên Nghiệp',
      'Báo cáo tùy chỉnh theo yêu cầu',
      'Phân tích AI & dự đoán doanh thu',
      'Tích hợp API với hệ thống khác',
      'Hỗ trợ 24/7 qua điện thoại',
      'Đào tạo nhân viên miễn phí',
      'Tư vấn vận hành',
    ],
  },
];

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<{
    maxStores: number;
    currentStores: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await apiClient.request<{
        maxStores: number;
        currentStores: number;
      }>('/subscription/current');
      setCurrentPlan(response);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string, maxStores: number) => {
    setUpgrading(planId);
    try {
      await apiClient.request('/subscription/upgrade', { 
        method: 'POST',
        body: { 
          planId,
          maxStores 
        }
      });
      
      toast({
        title: 'Nâng cấp thành công!',
        description: `Bạn đã nâng cấp lên ${plans.find(p => p.id === planId)?.name}`,
      });
      
      await fetchCurrentPlan();
    } catch (error: any) {
      toast({
        title: 'Lỗi nâng cấp',
        description: error.message || 'Không thể nâng cấp gói. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản Lý Gói Dịch Vụ</h1>
        <p className="text-muted-foreground">
          Nâng cấp gói để tạo thêm cửa hàng và mở khóa nhiều tính năng hơn
        </p>
      </div>

      {currentPlan && (
        <Card className="mb-8 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Gói Hiện Tại
            </CardTitle>
            <CardDescription>
              Bạn đang sử dụng <strong>{currentPlan.currentStores}</strong> / <strong>{currentPlan.maxStores}</strong> cửa hàng
              {currentPlan.currentStores >= currentPlan.maxStores && (
                <span className="text-destructive ml-2">
                  (Đã đạt giới hạn - Vui lòng nâng cấp để tạo thêm cửa hàng)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      currentPlan.currentStores >= currentPlan.maxStores
                        ? 'bg-destructive'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((currentPlan.currentStores / currentPlan.maxStores) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-sm font-medium">
                {currentPlan.currentStores} / {currentPlan.maxStores}
              </div>
            </div>
            {currentPlan.maxStores - currentPlan.currentStores > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                Bạn còn có thể tạo thêm <strong>{currentPlan.maxStores - currentPlan.currentStores}</strong> cửa hàng nữa
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.maxStores === plan.maxStores;
          const canUpgrade = currentPlan && currentPlan.maxStores < plan.maxStores;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${isCurrentPlan ? 'border-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Phổ biến nhất</Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500">Gói hiện tại</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {plan.icon}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-muted-foreground">đ/tháng</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={isCurrentPlan || !canUpgrade || upgrading !== null}
                  onClick={() => handleUpgrade(plan.id, plan.maxStores)}
                >
                  {upgrading === plan.id ? (
                    'Đang xử lý...'
                  ) : isCurrentPlan ? (
                    'Gói hiện tại'
                  ) : canUpgrade ? (
                    'Nâng cấp ngay'
                  ) : (
                    'Không khả dụng'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="font-semibold mb-3 text-lg">📋 Lưu ý quan trọng:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Giá trên là giá theo tháng, thanh toán hàng tháng (chưa bao gồm VAT)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Bạn có thể nâng cấp gói bất kỳ lúc nào. Phí sẽ được tính theo tỷ lệ thời gian sử dụng</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Dữ liệu của bạn sẽ được bảo toàn 100% khi thay đổi gói</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Khi đạt giới hạn số cửa hàng, bạn cần nâng cấp gói để tạo thêm cửa hàng mới</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Liên hệ hỗ trợ: <strong>support@smartinventory.vn</strong> hoặc <strong>1900-xxxx</strong> nếu cần tư vấn</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
