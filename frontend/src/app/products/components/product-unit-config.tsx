'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface Unit {
  id: string;
  name: string;
}

interface ProductUnitConfigProps {
  productId: string;
  onSaved?: () => void;
}

export function ProductUnitConfig({ productId, onSaved }: ProductUnitConfigProps) {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    baseUnitId: '',
    conversionUnitId: '',
    conversionRate: 2,
    baseUnitPrice: 0,
    conversionUnitPrice: 0,
  });

  useEffect(() => {
    loadUnits();
    loadExistingConfig();
  }, [productId]);

  const loadUnits = async () => {
    try {
      const data = await apiClient.getUnits();
      setUnits(data);
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  };

  const loadExistingConfig = async () => {
    try {
      const { productUnit } = await apiClient.getProductUnits(productId);
      if (productUnit) {
        setConfig({
          baseUnitId: productUnit.baseUnitId,
          conversionUnitId: productUnit.conversionUnitId,
          conversionRate: productUnit.conversionRate,
          baseUnitPrice: productUnit.baseUnitPrice,
          conversionUnitPrice: productUnit.conversionUnitPrice,
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const handleSave = async () => {
    if (!config.baseUnitId || !config.conversionUnitId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn đầy đủ đơn vị',
        variant: 'destructive',
      });
      return;
    }

    if (config.conversionRate < 2) {
      toast({
        title: 'Lỗi',
        description: 'Tỷ lệ quy đổi phải lớn hơn hoặc bằng 2',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.createOrUpdateProductUnits(productId, config);
      toast({
        title: 'Thành công',
        description: 'Đã lưu cấu hình đơn vị',
      });
      onSaved?.();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể lưu cấu hình',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBaseUnit = units.find((u) => u.id === config.baseUnitId);
  const selectedConversionUnit = units.find((u) => u.id === config.conversionUnitId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu hình Đơn vị Quy đổi</CardTitle>
        <CardDescription>
          Thiết lập tỷ lệ quy đổi giữa đơn vị lẻ và đơn vị đóng gói
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Đơn vị cơ bản (lẻ)</Label>
            <Select value={config.baseUnitId} onValueChange={(v) => setConfig({ ...config, baseUnitId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đơn vị" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Đơn vị quy đổi (đóng gói)</Label>
            <Select value={config.conversionUnitId} onValueChange={(v) => setConfig({ ...config, conversionUnitId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đơn vị" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tỷ lệ quy đổi</Label>
          <Input
            type="number"
            min="2"
            value={config.conversionRate}
            onChange={(e) => setConfig({ ...config, conversionRate: parseInt(e.target.value) || 2 })}
          />
          {selectedBaseUnit && selectedConversionUnit && (
            <p className="text-sm text-muted-foreground">
              1 {selectedConversionUnit.name} = {config.conversionRate} {selectedBaseUnit.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Giá bán đơn vị cơ bản</Label>
            <Input
              type="number"
              min="0"
              value={config.baseUnitPrice}
              onChange={(e) => setConfig({ ...config, baseUnitPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Giá bán đơn vị quy đổi</Label>
            <Input
              type="number"
              min="0"
              value={config.conversionUnitPrice}
              onChange={(e) => setConfig({ ...config, conversionUnitPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
        </Button>
      </CardContent>
    </Card>
  );
}
